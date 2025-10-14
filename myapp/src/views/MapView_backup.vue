<script setup>
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTripsStore } from '@/stores/tripsStore';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import { activityMonitor } from '@/tools/activityMonitor';

import BaseMap from '@/components/BaseMap.vue';
import VehicleListPanel from '@/components/map-view/VehicleListPanel.vue';
import VehicleDetailPanel from '@/components/map-view/VehicleDetailPanel.vue';
import MapOptionsMenu from '@/components/BaseMap/MapOptionsMenu.vue';
import TripReplayLayer from '@/components/map-view/TripReplayLayer.vue'; 
import GeofenceLayer from '@/components/map-view/GeofenceLayer.vue';
import { useGeofenceStore } from '@/stores/geofenceStore';

// --- STATE MANAGEMENT ---
const vehiclesStore = useVehiclesStore();
const settingsStore = useSettingsStore();
const tripsStore    = useTripsStore();
const geofenceStore = useGeofenceStore();

const { vehicles, isLoading } = storeToRefs(vehiclesStore);
const { activeTrips } = storeToRefs(tripsStore);
const { getActiveGeofenceData } = storeToRefs(geofenceStore);


useAutoRefresh(() => vehiclesStore.fetchVehicles({ isBackground: true }), settingsStore.vehiclesRefreshRate);

// --- LOCAL STATE ---
const baseMapRef = ref(null);
const selectedVehicle = ref(null);
const isDetailPanelOpen = ref(false);
const isOptionsMenuOpen = ref(false);
const isTripsLayerVisible = ref(true);
const currentMapStyle = ref('standard');
const trafficLayers = ref({ incidents: false, flow: false });
const mapInstance = ref(null);
const activeFilters = reactive({
  searchTerm: '',
  vehicleType: 'all',
  statuses: {driving: true,idle: true,stopped: true,rest: true,alert: true,noLocation: false,delayed: true,geofence: false,activeToday: false}
});
const activeGeofenceData = ref(null);

// --- COMPUTED PROPERTIES ---
const shouldShowTripLayer = computed(() => {
  const hasActiveTrips = Object.keys(activeTrips.value).length > 0;
  return hasActiveTrips && isTripsLayerVisible.value && !!mapInstance.value;
});
const hasActiveTrips = computed(() => {
  return Object.keys(activeTrips.value).length > 0;
});
const shouldShowGeofenceLayer = computed(() => {
  return !!getActiveGeofenceData.value && !!mapInstance.value;
});
const filteredVehicles = computed(() => {
  // Your full filtering logic
  let result = vehicles.value;
  if (activeFilters.searchTerm) {
    const term = activeFilters.searchTerm.toLowerCase();
    result = result.filter(vehicle => 
      vehicle.customerVehicleName?.toLowerCase().includes(term) ||
      vehicle.drivers?.[0]?.driverName?.toLowerCase().includes(term) ||
      vehicle.licensePlate?.toLowerCase().includes(term) ||
      vehicle.memberOf?.toLowerCase().includes(term)
    );
  }
  if (activeFilters.vehicleType !== 'all') {
    result = result.filter(vehicle => vehicle.type?.toUpperCase() === activeFilters.vehicleType);
  }
  const hasActiveFilter = Object.values(activeFilters.statuses).some(v => v);
  if (!hasActiveFilter) return [];
  result = result.filter(vehicle => {
    if (activeFilters.statuses.driving && vehicle.status?.driving) return true;
    if (activeFilters.statuses.idle && (vehicle.status?.idle || vehicle.status?.paused)) return true;
    // ... rest of your status filter logic
    return false;
  });
  return result;
});

const vehicleMarkers = computed(() => {
 console.log('=== MARKER COMPUTATION START ===');
  console.log('filteredVehicles count:', filteredVehicles.value.length);
  
  // Check if FrenchDemo_401 is in filtered vehicles
  const frenchDemo = filteredVehicles.value.find(v => v.customerVehicleName === 'FrenchDemo_401');
  if (frenchDemo) {
    console.log('✓ FrenchDemo_401 found in filteredVehicles:', {
      id: frenchDemo.id,
      name: frenchDemo.customerVehicleName,
      status: frenchDemo.status,
      location: frenchDemo.location,
      hasLat: frenchDemo.location?.latitude != null,
      hasLng: frenchDemo.location?.longitude != null
    });
  } else {
    console.log('✗ FrenchDemo_401 NOT in filteredVehicles');
  }

  return filteredVehicles.value
    .filter(v => v.location?.latitude != null && v.location?.longitude != null)
    .map(v => ({ ...v, lat: v.location.latitude, lng: v.location.longitude }));
});

// --- METHODS & WATCHERS ---
function handleVehicleSelect(vehicle) {
  tripsStore.clearAllActiveTrips();
  activeGeofenceData.value = null; // MODIFIED: Clear geofence data on new vehicle selection
  activityMonitor.updateActivity();
  if (vehicle.location?.latitude && vehicle.location?.longitude && baseMapRef.value) {
    baseMapRef.value.zoomToLocation(vehicle.location.latitude, vehicle.location.longitude, 16);
  }
  selectedVehicle.value = vehicle;
  isDetailPanelOpen.value = true;
}

function handleMarkerClick(markerId) {
  activityMonitor.updateActivity();
  const vehicle = vehicles.value.find(v => v.id === markerId);
  if (vehicle) handleVehicleSelect(vehicle);
}

function closeDetailsPanel() {
  tripsStore.clearAllActiveTrips(); 
  geofenceStore.clearAllActiveGeofences();
  isDetailPanelOpen.value = false;
  selectedVehicle.value = null;
}

function handleFiltersUpdate(filters) {
  activeFilters.searchTerm = filters.searchTerm || '';
  activeFilters.vehicleType = filters.vehicleType;
  activeFilters.statuses = { ...filters.statuses };
}

function handleTripsUpdate(isVisible) { isTripsLayerVisible.value = isVisible; }
function handleOpenOptionsMenu() { isOptionsMenuOpen.value = true; }
function closeOptionsMenu() { isOptionsMenuOpen.value = false; }
function handleStyleUpdate(newStyle) { currentMapStyle.value = newStyle; }
function handleTrafficUpdate(newTrafficLayers) { trafficLayers.value = newTrafficLayers; }

// Get map instance after BaseMap is mounted
onMounted(async () => {
  await nextTick();
  if (baseMapRef.value && baseMapRef.value.getMapInstance) {
    mapInstance.value = baseMapRef.value.getMapInstance();
    console.log('Map instance obtained:', !!mapInstance.value);
  }
});

// Watch for BaseMap ref changes to get map instance
watch(baseMapRef, async (newRef) => {
  if (newRef && newRef.getMapInstance) {
    await nextTick();
    mapInstance.value = newRef.getMapInstance();
    console.log('Map instance updated from ref change:', !!mapInstance.value);
  }
});

watch(activeTrips, (newTrip) => {
  console.log('ActiveTrip changed in MapView:', newTrip?.id);
  if (newTrip) {
    isTripsLayerVisible.value = true;
  }
});
watch(isDetailPanelOpen, () => {
  // Wait for the CSS transition (300ms) to complete before updating the map size.
  // We'll wait a little extra (350ms) to be safe.
  setTimeout(() => {
    if (baseMapRef.value) {
      baseMapRef.value.invalidateSize();
    }
  }, 350);
});
</script>

<template>
  <div class="map-view-container bg-body p-4">
    <div class="background-vehicle-list">
      <VehicleListPanel
        :vehicles="vehicles"
        :selected-vehicle-id="selectedVehicle?.id"
        @vehicle-selected="handleVehicleSelect"
        @filters-updated="handleFiltersUpdate"
      />
    </div>

    <div class="map-area shadow-lg" :class="{ 'map-shifted': isDetailPanelOpen }">
      <BaseMap 
        ref="baseMapRef"
        :markers="vehicleMarkers"
        :has-active-trips="hasActiveTrips"
        :map-style="currentMapStyle"
        :traffic-layers="trafficLayers"
        popup-variant="map-view"
        :selected-marker-id="selectedVehicle?.id"
        @request-open-options="handleOpenOptionsMenu"
        @marker-click="handleMarkerClick"
      />
      <TripReplayLayer 
        v-if="shouldShowTripLayer" 
        :map="mapInstance"
      />
      <GeofenceLayer 
        v-if="shouldShowGeofenceLayer"
        :map="mapInstance"
      />
    </div>

    <div v-if="isDetailPanelOpen && selectedVehicle" :key="selectedVehicle.id" class="sliding-detail-panel" :class="{ 'panel-visible': isDetailPanelOpen }">
      <VehicleDetailPanel
        :vehicle="selectedVehicle"
        variant="full"
        @close="closeDetailsPanel"
        @update:active-geofence="onActiveGeofenceUpdate"
      />
    </div>

    <div v-if="isOptionsMenuOpen" class="options-menu-overlay" @click="closeOptionsMenu">
      <div class="options-menu-container" @click.stop>
        <MapOptionsMenu
          :is-open="isOptionsMenuOpen"
          :current-style="currentMapStyle"
          :active-trip="activeTrip"
          :is-trips-layer-visible="isTripsLayerVisible"
          @close="closeOptionsMenu"
          @update:style="handleStyleUpdate"
          @update:traffic="handleTrafficUpdate"
          @update:trips="handleTripsUpdate"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Your full, existing styles for MapView.vue */
.map-view-container { position: relative; height: calc(100vh - 64px); width: 100%; overflow: hidden; display: flex; padding: 1rem; }
.background-vehicle-list { position: absolute; top: 1rem; left: 1rem; width: 330px; height: calc(100vh - 64px - 2rem); z-index: 1; }
.map-area { position: relative; width: 100%; height: 100%; z-index: 10; transition: all 0.3s ease-in-out; margin-left: 346px; border-radius: var(--radius); }
.map-area.map-shifted { width: calc(100% - 720px); margin-left: 792px; }
.sliding-detail-panel { position: absolute; top: 1rem; left: 362px; width: 422px; height: calc(100vh - 64px - 2rem); border-radius: var(--radius); background-color: transparent; z-index: 10; transform: translateX(-100%); opacity: 0; transition: all 0.3s ease-in-out; }
.sliding-detail-panel.panel-visible { transform: translateX(0); opacity: 1; }
.options-menu-overlay { position: absolute; top: 2rem; left: 0; right: 1.5rem; bottom: 0; height: calc(100vh - 64px - 4rem); background-color: transparent; z-index: 10; display: flex; justify-content: flex-end; }
.options-menu-container { height: 100%; animation: slideInFromRight 0.3s ease-out; border-radius: var(--radius); }
@keyframes slideInFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
</style>