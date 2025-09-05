<script setup>
// ✅ UPDATED: onMounted and onUnmounted are no longer needed for refresh logic
import { computed, ref } from 'vue'; 
import { storeToRefs } from 'pinia'; 
import { useDashboardStore } from '@/stores/dashboardStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import StatisticsPanel from '@/components/dashboard/StatisticsPanel.vue';
import BaseMap from '@/components/BaseMap.vue';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import MapFilterButton from '@/components/dashboard/MapFilterButton.vue';
import { Navigation, Bed, Wrench, ParkingSquare as SquareParking , CalendarCheck2 } from 'lucide-vue-next';


const dashboardStore = useDashboardStore();
const settingsStore = useSettingsStore();
const vehiclesStore = useVehiclesStore();
const activeFilter = ref(null);

// ✅ UPDATED: Use the correct 'vehicleAnalytics' getter
const { vehicles, vehicleAnalytics } = storeToRefs(vehiclesStore);

const vehicleMarkers = computed(() => {
  return vehicles.value
    .filter(v => v.location?.latitude != null && v.location?.longitude != null)
    .map(v => ({
      ...v, 
      lat: v.location.latitude,
      lng: v.location.longitude,
    }));
});

const filteredMarkers = computed(() => {
  const filter = activeFilter.value;
  if (!filter) return vehicleMarkers.value;
  
  return vehicleMarkers.value.filter(v => {
    switch(filter) {
      case 'driving': return v.status?.driving;
      case 'idle': return v.status?.paused;
      case 'rest': return v.drivers?.[0]?.workingState === 'REST';
      case 'workshop': return false; // Placeholder
      case 'activeToday': return isToday(v.lastActivity);
      default: return true;
    }
  });
});

const filterConfig = [
  { id: 'driving', label: 'Driving', icon: Navigation },
  { id: 'idle', label: 'Idle', icon: SquareParking },
  { id: 'rest', label: 'Rest', icon: Bed },
  { id: 'workshop', label: 'Workshop', icon: Wrench },
  { id: 'activeToday', label: 'Active Today', icon: CalendarCheck2 },
];

const handleFilterClick = (filterId) => {
  activeFilter.value = activeFilter.value === filterId ? null : filterId;
};

const isToday = (someDate) => {
  if (!someDate) return false;
  const today = new Date();
  const dateToCompare = new Date(someDate);
  return dateToCompare.getDate() === today.getDate() &&
    dateToCompare.getMonth() === today.getMonth() &&
    dateToCompare.getFullYear() === today.getFullYear();
};
dashboardStore.fetchDashboardData();

vehiclesStore.fetchVehicles();
dashboardStore.fetchDashboardData();
useAutoRefresh(vehiclesStore.fetchVehicles, settingsStore.vehiclesRefreshRate);
useAutoRefresh(dashboardStore.fetchDashboardData, settingsStore.dashboardRefreshRate);

</script>

<template>
  <div class="h-full p-4 lg:p-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div class="lg-col-span-1 space-y-6 overflow-y-auto">
        <StatisticsPanel />
      </div>

       <div class="lg:col-span-1 bg-card rounded-lg shadow-sm border flex flex-col relative"> 
        <div class="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
          <MapFilterButton
            v-for="filter in filterConfig"
            :key="filter.id"
            :icon="filter.icon"
            :label="filter.label"
            :count="vehicleAnalytics.statusCounts[filter.id] || 0"
            :is-active="activeFilter === filter.id"
            @click="handleFilterClick(filter.id)"
          />
        </div>
        <div class="flex-grow rounded-md overflow-hidden">
          <BaseMap :markers="filteredMarkers" />
        </div>
      </div>
    </div>
  </div>
</template>