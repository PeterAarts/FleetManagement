import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';
import { useSettingsStore } from './settingsStore';
import { useAuthStore } from './authStore';

let pollingInterval = null;

const isToday = (someDate) => {
  if (!someDate) return false;
  const today = new Date();
  const dateToCompare = new Date(someDate);
  return dateToCompare.getDate() === today.getDate() &&
    dateToCompare.getMonth() === today.getMonth() &&
    dateToCompare.getFullYear() === today.getFullYear();
};

const parseTimeToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return Infinity;
  const parts = timeString.split(':').map(Number);
  if (parts.length !== 3) return Infinity;
  const sign = timeString.startsWith('-') ? -1 : 1;
  return sign * (Math.abs(parts[0] * 60) + parts[1] + (parts[2] / 60));
};

export const useVehiclesStore = defineStore('vehicles', {
  state: () => ({
    vehicles: [],
    groups: [],
    isLoading: false,
    lastUpdated: null,
  }),
  getters: {
    canEdit: () => true,
    canDelete: () => true,
    
    // Group vehicles by their memberOf property
    vehiclesByGroup(state) {
      return state.vehicles.reduce((acc, vehicle) => {
        const groupName = vehicle.memberOf || 'Uncategorized';
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(vehicle);
        return acc;
      }, {});
    },
    
    vehicleAnalytics(state) {
      const settingsStore = useSettingsStore();
      const speedingThreshold = settingsStore.settings?.speedingThreshold || 95;

      const analytics = {
        driverStatus: { active: 0, idle: 0, offline: 0 },
        fleetDiagnostics: {
          severeDamages: 0, geofenceTriggers: 0, maintenanceOverdue: 0,
          fuelIncidents: 0, batteryIssues: 0, speedingDrivers: 0,
          driveTimeExceeded: 0,
        },
        statusCounts: {
          driving: 0, idle: 0, rest: 0, workshop: 0, activeToday: 0,
        },
      };

      if (!state.vehicles || state.vehicles.length === 0) {
        return analytics;
      }

      for (const v of state.vehicles) {
        // Driver Status
        if (v.tripActive) analytics.driverStatus.active++;
        if (v.tripActive && v.drivers?.length > 1) analytics.driverStatus.idle++;
        
        // Fleet Diagnostics
        if (v.damageCount > 0) analytics.fleetDiagnostics.severeDamages++;
        if (v.geofence) analytics.fleetDiagnostics.geofenceTriggers++;
        if (v.serviceDistance < 1500) analytics.fleetDiagnostics.maintenanceOverdue++;
        if (v.fuelLevel < 2) analytics.fleetDiagnostics.fuelIncidents++;
        if (v.catalystFuelLevel < 2) analytics.fleetDiagnostics.batteryIssues++;
        if (v.currentSpeed > speedingThreshold) analytics.fleetDiagnostics.speedingDrivers++;
        if (parseTimeToMinutes(v.drivers?.[0]?.remainingDriveTime) < 1) analytics.fleetDiagnostics.driveTimeExceeded++;

        // Status Counts for Map Filters
        if (v.status?.driving) analytics.statusCounts.driving++;
        if (v.status?.paused) analytics.statusCounts.idle++;
        if (isToday(v.lastActivity)) analytics.statusCounts.activeToday++;
        if (v.drivers?.[0]?.workingState === 'REST') analytics.statusCounts.rest++;
      }

      return analytics;
    }
  },
  actions: {
    async checkForUpdates() {
      const settingsStore = useSettingsStore();
      const groupId = settingsStore.selectedGroup;
      if (!groupId) return;

      try {
        const response = await apiClient.get(`/vehicles/latest-activity?group=${groupId}`);
        const latestServerTimestamp = response.data.latestActivity;

        if (latestServerTimestamp && new Date(latestServerTimestamp) > new Date(this.lastUpdated)) {
          console.log('New vehicle activity detected. Fetching updates...');
          await this.fetchVehicles();
        } else {
          console.log('No new vehicle activity. Skipping fetch.');
        }
      } catch (error) {
        console.error('Failed to check for vehicle updates:', error);
      }
    },
    
    async fetchVehicles(options = {}) {
      const settingsStore = useSettingsStore();
      const authStore = useAuthStore();
      const groupId = settingsStore.selectedGroup || authStore.effectiveCustomerId;
      if (!groupId) return;

      this.isLoading = true;
      try {
        const config = {
          params: {},
          headers: {}
        };

        if (this.lastUpdated) {
          config.params.since = this.lastUpdated;
        }

        if (options.isBackground) {
          config.headers['X-Background-Refresh'] = 'true';
        }
        
        const response = await apiClient.get('/vehicles', config);
        
        if (!config.params.since) {
          // Full refresh - replace all vehicles
          this.vehicles = response.data.vehicles || [];
        } else {
          // Incremental update - merge changes
          this.mergeVehicleData(response.data.vehicles);
        }
        
        this.groups = response.data.groups || [];
        this.lastUpdated = new Date().toISOString();
        
      } catch (error) {
        console.error("Failed to fetch vehicles", error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchVehicleDetails(id) {
      this.isLoading = true;
      this.error = null;
      this.selectedVehicle = null;
      try {
        const response = await apiClient.get(`/vehicles/${id}`);
        this.selectedVehicle = response.data;
      } catch (err) {
        this.error = 'Failed to fetch vehicle details.';
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    
    mergeVehicleData(newVehicles) {
      if (!newVehicles || newVehicles.length === 0) return;
      
      const vehicleMap = new Map(this.vehicles.map(v => [v.id, v]));
      
      newVehicles.forEach(newVehicle => { 
        const existingVehicle = vehicleMap.get(newVehicle.id);
        
        if (existingVehicle) {
          // Deep merge to preserve nested structures like drivers array
          Object.keys(newVehicle).forEach(key => {
            if (Array.isArray(newVehicle[key])) {
              // For arrays (like drivers), replace entirely to ensure fresh data
              existingVehicle[key] = [...newVehicle[key]];
            } else if (typeof newVehicle[key] === 'object' && newVehicle[key] !== null) {
              // For objects (like status, location), merge properties
              existingVehicle[key] = { ...existingVehicle[key], ...newVehicle[key] };
            } else {
              // For primitives, simply assign
              existingVehicle[key] = newVehicle[key];
            }
          });
        } else {
          // New vehicle - add to the array
          this.vehicles.push(newVehicle);
        }
      });
    },

    resetForNewGroup() {
      this.vehicles = [];
      this.groups = [];
      this.lastUpdated = null;
    },
  },
});