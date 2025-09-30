<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useAutoRefresh } from '@/composables/useAutoRefresh';

import StatisticsPanel from '@/components/dashboard/StatisticsPanel.vue';
import BaseMap from '@/components/BaseMap.vue';
import MapFilterButton from '@/components/dashboard/MapFilterButton.vue';
import MapOptionsMenu from '@/components/BaseMap/MapOptionsMenu.vue';

import { Navigation, Bed, Wrench, ParkingSquare as SquareParking , CalendarCheck2 } from 'lucide-vue-next';

// --- State Management and Stores ---
const dashboardStore = useDashboardStore();
const settingsStore = useSettingsStore();
const vehiclesStore = useVehiclesStore();
const { selectedGroup } = storeToRefs(settingsStore);
const { vehicles, vehicleAnalytics } = storeToRefs(vehiclesStore);

// --- Local State for UI Control ---
const activeFilter = ref(null);
const isOptionsOpen = ref(false);
const activeMapStyle = ref('standard'); // Default style
const activeTrafficLayers = ref({
  incidents: false,
  flow: false,
});

const toggleOptions = () => {
  isOptionsOpen.value = !isOptionsOpen.value;
};
function handleStyleUpdate(styleId) {
  activeMapStyle.value = styleId;
}
function handleTrafficUpdate(trafficState) {
  activeTrafficLayers.value = trafficState;
}
// --- Computed Properties for Map Data ---
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

// --- Configuration for Filter Buttons ---
const filterConfig = [
  { id: 'driving', label: 'Driving', icon: Navigation },
  { id: 'idle', label: 'Idle', icon: SquareParking },
  { id: 'rest', label: 'Rest', icon: Bed },
  { id: 'workshop', label: 'Workshop', icon: Wrench },
  { id: 'activeToday', label: 'Active Today', icon: CalendarCheck2 },
];

// --- Methods ---
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
// Watch for group changes ---
watch(selectedGroup, (newGroupId) => {
  if (newGroupId) {
    dashboardStore.fetchDashboardData();
  }
}, { immediate: true });

// --- Data Fetching and Auto-Refresh ---
dashboardStore.fetchDashboardData(); // Dashboard-specific data still fetched here
useAutoRefresh(
  () => vehiclesStore.fetchVehicles({ isBackground: true }), 
  settingsStore.vehiclesRefreshRate
);
useAutoRefresh(dashboardStore.fetchDashboardData, settingsStore.dashboardRefreshRate);

</script>

<template>
  <div class="h-full p-4 lg:p-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      
      <div class="lg:col-span-1 space-y-6 overflow-y-auto">
        <StatisticsPanel />
      </div>

       <div class="map-grid-container hidden lg:grid" :class="{ 'menu-open': isOptionsOpen }">
        
        <div class="map-wrapper">
          <div class="absolute top-3 px-3 z-40 flex items-center gap-2">
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
            <BaseMap 
              :markers="filteredMarkers" 
              :map-style="activeMapStyle"
              :traffic-layers="activeTrafficLayers"
              @request-open-options="toggleOptions" 
            />
          </div>
        </div>

        <div class="options-wrapper">
          <MapOptionsMenu 
            :is-open="isOptionsOpen" 
            :current-style="activeMapStyle" @close="toggleOptions"
            @update:style="handleStyleUpdate"
            @update:traffic="handleTrafficUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-grid-container {
  display: grid;
  /* Map takes all available space, menu starts with 0 width */
  grid-template-columns: 1fr 0;
  border-radius: 0.5rem; /* from rounded-lg */
  overflow: hidden; /* Important to contain the rounded corners */
  transition: grid-template-columns 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  border: 1px solid hsl(var(--border));
}

.map-grid-container.menu-open {
  /* When open, menu gets 320px, and the map column adjusts automatically */
  grid-template-columns: 1fr 250px;
}

.map-wrapper {
  grid-column: 1 / 2;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.options-wrapper {
  grid-column: 2 / 3;
  overflow: hidden; /* Hides the menu content until it has space */
}
</style>