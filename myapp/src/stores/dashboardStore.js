import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';
import { useSettingsStore } from './settingsStore';
import { useVehiclesStore } from './vehiclesStore';

const parseTimeToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return Infinity;
  const parts = timeString.split(':').map(Number);
  if (parts.length !== 3) return Infinity;
  const sign = timeString.startsWith('-') ? -1 : 1;
  return sign * (Math.abs(parts[0] * 60) + parts[1] + (parts[2] / 60));
};

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    isLoading: false,
    statistics: {
      kpis: {},
    },
    graphData: [],
    activeGraph: null,
  }),

  getters: {
    driverStatus(state) {
      const vehiclesStore = useVehiclesStore();
      const vehicles = vehiclesStore.vehicles;
      if (!vehicles || vehicles.length === 0) {
        return { active: 0, idle: 0, offline: 0 };
      }
      const activeDrivers = vehicles.filter(v => v.tripActive).length;
      const idleDrivers = vehicles.filter(v => v.tripActive && v.drivers && v.drivers.length > 1).length;
      return { active: activeDrivers, idle: idleDrivers, offline: 0 };
    },
    fleetDiagnostics(state) {
      const vehiclesStore = useVehiclesStore();
      const settingsStore = useSettingsStore();
      const vehicles = vehiclesStore.vehicles;
      const speedingThreshold = settingsStore.settings?.speedingThreshold || 95;
      if (!vehicles || vehicles.length === 0) return {};
      return vehicles.reduce((diagnostics, vehicle) => {
        if (vehicle.damageCount > 0) diagnostics.severeDamages++;
        if (vehicle.geofence) diagnostics.geofenceTriggers++;
        if (vehicle.serviceDistance < 1500) diagnostics.maintenanceOverdue++;
        if (vehicle.fuelLevel < 2) diagnostics.fuelIncidents++;
        if (vehicle.catalystFuelLevel < 2) diagnostics.batteryIssues++;
        if (vehicle.currentSpeed > speedingThreshold) diagnostics.speedingDrivers++;
        const remainingTime = parseTimeToMinutes(vehicle.drivers?.[0]?.remainingDriveTime);
        if (remainingTime < 1) diagnostics.driveTimeExceeded++;
        return diagnostics;
      }, {
        severeDamages: 0, geofenceTriggers: 0, maintenanceOverdue: 0,
        fuelIncidents: 0, batteryIssues: 0, speedingDrivers: 0,
        driveTimeExceeded: 0, activeTelltales: 0, oilLevelWarnings: 0,
        tireWarnings: 0, engineWarnings: 0, etaNotMet: 0
      });
    },
    formattedGraphData(state) {
      if (!state.activeGraph || state.graphData.length === 0) {
        return { labels: [], datasets: [] };
      }
      const labels = state.graphData.map(item => item.trip_date);
      const dataset = {};
      switch (state.activeGraph) {
        case 'trips':
          dataset.label = 'Total Trips';
          dataset.data = state.graphData.map(item => item.total_trips);
          break;
        case 'distance':
          dataset.label = 'Total Distance (km)';
          dataset.data = state.graphData.map(item => item.total_distance);
          break;
        case 'fuelUsed':
          dataset.label = 'Total Fuel Used (L)';
          dataset.data = state.graphData.map(item => item.total_fuelused);
          break;
        case 'fuelUsage':
          dataset.label = 'Average Fuel Usage (L/100km)';
          dataset.data = state.graphData.map(item => item.avg_fuelusage);
          break;
        case 'co2':
          dataset.label = 'CO₂ Emission (Tons)';
          dataset.data = state.graphData.map(item => item.total_co2_emission);
          break;
        case 'vehiclesActive':
          dataset.label = 'Active Vehicles';
          dataset.data = state.graphData.map(item => item.vehicles_driving);
          break;
        default:
          return { labels: [], datasets: [] };
      }
      return { labels, datasets: [dataset] };
    }
  },

  actions: {
    async fetchDashboardData() {
      const settingsStore = useSettingsStore();
      const groupId = settingsStore.selectedGroup;
      const days = settingsStore.settings?.daysStatistics ?? 30;
      if (!groupId) return;
      this.isLoading = true;
      try {
        const params = new URLSearchParams({ days: days });
        const response = await apiClient.get(`/dashboard?${params.toString()}`);
        const apiData = response.data;
        this.graphData = apiData.trends || [];
        const stats = apiData.statistics;
        this.statistics = {
         kpis: {
          trips: { value: (stats.trips ?? 0).toFixed(1), change: stats.tripsChange },
          distance: { value: (stats.distance ?? 0).toFixed(0), change: stats.distanceChange },
          fuelUsed: { value: (stats.fuelUsed ?? 0).toFixed(0), change: stats.fuelUsedChange },
          fuelUsage: { value: (stats.fuelUsage ?? 0).toFixed(2), change: stats.fuelUsageChange },
          co2: { value: (stats.co2 ?? 0).toFixed(2), change: stats.co2Change },
          vehiclesActive: { value: (stats.vehiclesActive ?? 0).toFixed(1), change: stats.vehiclesActiveChange }
        }
        };
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        this.resetForNewGroup();
      } finally {
        this.isLoading = false;
      }
    },
    
    resetForNewGroup() {
      this.statistics = { kpis: {} };
      this.graphData = [];
      this.activeGraph = null;
      this.isLoading = false;
    },

    toggleActiveGraph(statisticName) {
      if (this.activeGraph === statisticName) {
        this.activeGraph = null;
      } else {
        this.activeGraph = statisticName;
      }
    }
  },
});