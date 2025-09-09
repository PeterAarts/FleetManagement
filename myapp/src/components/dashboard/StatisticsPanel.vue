<script setup>
import { computed, onMounted, ref, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useSettingsStore } from '@/stores/settingsStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import StatisticsBadge from './StatisticsBadge.vue';
import StatusBadge from './StatusBadge.vue';
import FleetDiagnosticsPanel from './FleetDiagnosticsPanel.vue';
import DashboardChart from './DashboardChart.vue';

import { 
  Users, 
  UserX, 
  UserCheck,
  AlertTriangle, 
  Wrench,
  Activity, 
  Route,    
  Fuel,   
  Cloud, 
  Droplet, Truck,     
} from 'lucide-vue-next';

const dashboardStore = useDashboardStore();
const { 
  statistics: stats, 
  activeGraph, 
  formattedGraphData,
  driverStatus,
  fleetDiagnostics
} = storeToRefs(dashboardStore);

const settingsStore = useSettingsStore(); 
const { daysStatistics } = storeToRefs(settingsStore);

const primaryColor = ref(null);

onMounted(() => {
  // This polling mechanism is correct and will stay.
  let attempts = 0;
  const maxAttempts = 20;
  const intervalId = setInterval(() => {
    try {
      const colorValue = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      if (colorValue) {
        primaryColor.value = colorValue;
        clearInterval(intervalId);
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
      attempts++;
    } catch (e) {
      clearInterval(intervalId);
    }
  }, 100);
});
// The rest of your script (finalChartData, chartOptions, etc.) remains exactly the same.
const finalChartData = computed(() => {
  const { labels, datasets } = formattedGraphData.value;

  if (!datasets || datasets.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Create a new dataset array to ensure reactivity.
  const styledDatasets = datasets.map(dataset => ({
    ...dataset, 
    backgroundColor: primaryColor.value || '#ffaa00', // Apply primary color or a gray fallback
    borderRadius: 4,
  }));

  // Return a brand new object, which Vue will always detect as a change.
  return { labels, datasets: styledDatasets };
});

const chartOptions = computed(() => {
  // Find the min and max values from the dataset to display on the Y-axis
  const dataValues = formattedGraphData.value.datasets[0]?.data || [];
  const minValue = Math.min(...dataValues);
  const maxValue = Math.max(...dataValues);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        // Optional: Customize tooltip appearance
        backgroundColor: '#1e293b',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          // ✅ Formats date to MM-DD and shows one every 7 days
          callback: function(value, index) {
            const dateLabel = this.getLabelForValue(value);
            return index % 7 === 0 ? dateLabel.substring(5) : '';
          },
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        }
      },
      y: {
        border: { display: false },
        grid: {
          color: '#e5e7eb',
          borderDash: [5, 5],
        },
        // ✅ Shows only the min and max values on the Y-axis
        ticks: {
          callback: function(value) {
            if (value === minValue || value === maxValue) {
              return value.toFixed(0);
            }
            return ''; // Return empty for all other ticks
          },
          stepSize: (maxValue - minValue) / 4 // Adjust step size for better tick placement
        }
      }
    }
  };
});

const activeGraphTitle = computed(() => {
    switch(activeGraph.value) {
        case 'trips': return 'Total Trips';
        case 'distance': return 'Total Distance';
        case 'fuelUsed': return 'Total Fuel Used';
        case 'fuelUsage': return 'Fuel Usage (l/100km)';
        case 'co2': return 'Total CO2 Emission';
        case 'vehiclesActive': return 'Active Vehicles';
        default: return 'Statistics';
    }
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Fleet Usage Statistics</CardTitle>
      <CardDescription>Daily average of {{ settingsStore.daysStatistics }}</CardDescription>
    </CardHeader>
    <CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatisticsBadge
        :icon="Activity" label="trips" :value="stats.kpis?.trips?.value"
        :trend="stats.kpis?.trips?.change"
        :is-active="activeGraph === 'trips'"
        @click="dashboardStore.toggleActiveGraph('trips')"
      />
      <StatisticsBadge
        :icon="Route" label="distance" :value="stats.kpis?.distance?.value" 
        :trend="stats.kpis?.distance?.change"
        :is-active="activeGraph === 'distance'"
        @click="dashboardStore.toggleActiveGraph('distance')"
      />
      <StatisticsBadge
        :icon="Fuel" label="fuel used (l)" :value="stats.kpis?.fuelUsed?.value"
        :trend="stats.kpis?.fuelUsed?.change"
        :is-active="activeGraph === 'fuelUsed'"
        @click="dashboardStore.toggleActiveGraph('fuelUsed')"
      />
      <StatisticsBadge
        :icon="Droplet" label="fuel usage (l/100km)" :value="stats.kpis?.fuelUsage?.value"
        :trend="stats.kpis?.fuelUsage?.change"
        :is-active="activeGraph === 'fuelUsage'"
        @click="dashboardStore.toggleActiveGraph('fuelUsage')"
      />
      <StatisticsBadge
        :icon="Cloud" label="co-2 in tons" :value="stats.kpis?.co2?.value"
        :trend="stats.kpis?.co2?.change"
        :is-active="activeGraph === 'co2'"
        @click="dashboardStore.toggleActiveGraph('co2')"
      />
      <StatisticsBadge
        :icon="Truck" label="vehicles active" :value="stats.kpis?.vehiclesActive?.value"
        :trend="stats.kpis?.vehiclesActive?.change"
        :is-active="activeGraph === 'vehiclesActive'"
        @click="dashboardStore.toggleActiveGraph('vehiclesActive')"
      />
    </CardContent>

    <CardContent v-if="activeGraph">
      <div class="h-40">
        <div class="w-full h-full  rounded-md flex items-center justify-center">
          <DashboardChart :chart-data="finalChartData" :chart-options="chartOptions" />
        </div>
      </div>
    </CardContent>
  </Card>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <Card class="lg:col-span-1">
      <CardHeader>
        <CardTitle>Driver Status</CardTitle>
      </CardHeader>
      <CardContent class="flex items-center justify-around text-center">
        <StatusBadge 
          :icon="UserCheck" 
          :value="driverStatus.active" 
          tooltip="Active Drivers" 
        />
        <StatusBadge 
          :icon="Users" 
          :value="driverStatus.idle" 
          tooltip="Idle Drivers (Co-Driver Present)" 
        />
        <StatusBadge 
          :icon="UserX" 
          :value="driverStatus.offline" 
          tooltip="Offline Drivers" 
        />
      </CardContent>
    </Card>

    <FleetDiagnosticsPanel :diagnostics-data="fleetDiagnostics" />

  </div> 
</template>