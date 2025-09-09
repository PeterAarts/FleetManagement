<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAutoRefresh } from '@/composables/useAutoRefresh';

import BaseMap from '@/components/BaseMap.vue';
import VehicleListPanel from '@/components/map-view/VehicleListPanel.vue';
import VehicleDetailPanel from '@/components/map-view/VehicleDetailPanel.vue';

// --- STATE MANAGEMENT ---
const vehiclesStore = useVehiclesStore();
const settingsStore = useSettingsStore();
const { vehicles } = storeToRefs(vehiclesStore);

const selectedVehicle = ref(null);
const isDetailPanelOpen = ref(false); // Controls the main panel's visibility

const vehicleMarkers = computed(() => {
  return vehicles.value
    .filter(v => v.location?.latitude != null && v.location?.longitude != null)
    .map(v => ({
      id: v.id,
      customerVehicleName: v.customerVehicleName,
      drivers: v.drivers,
      lat: v.location.latitude,
      lng: v.location.longitude,
      status: v.status,
      license: v.licensePlate, 
      speed: v.location.speed,
      lastUpdate: v.location.lastUpdate,
  }));
});

// --- METHODS ---
// When a vehicle is clicked in the list, show its inline details and close the main panel
function handleVehicleSelect(vehicle) {
  // Toggle selection off if the same vehicle is clicked again
  selectedVehicle.value = selectedVehicle.value?.id === vehicle.id ? null : vehicle;
  isDetailPanelOpen.value = false;
}

// When the user wants to see the full details, open the main panel
function handleOpenFullDetails(vehicle) {
  selectedVehicle.value = vehicle;
  isDetailPanelOpen.value = true;
}

// This now only closes the main panel
function closeDetailsPanel() {
  isDetailPanelOpen.value = false;
}

// --- DATA FETCHING ---
vehiclesStore.fetchVehicles();
useAutoRefresh(vehiclesStore.fetchVehicles, settingsStore.vehiclesRefreshRate);

</script>

<template>
  <div class="map-view-container">
    <VehicleListPanel
      :vehicles="vehicles"
      :selected-vehicle-id="selectedVehicle?.id"
      @vehicle-selected="handleVehicleSelect"
      @open-full-details="handleOpenFullDetails"
      class="vehicle-list-panel"
    />

    <!-- Visibility now depends on isDetailPanelOpen -->
    <VehicleDetailPanel
      v-if="isDetailPanelOpen && selectedVehicle"
      :vehicle="selectedVehicle"
      variant="full"
      @close="closeDetailsPanel"
      class="vehicle-detail-panel"
    />

    <div class="map-area">
      <BaseMap 
        :markers="vehicleMarkers"
        popup-variant="map-view" 
      />
    </div>
  </div>
</template>

<style scoped>
.map-view-container {
  display: flex;
  height: calc(100vh - 64px); /* Adjust based on your header height */
  width: 100%;
  overflow: hidden;
  background-color: #f8f9fa;
}
.vehicle-list-panel {
  width: 100%;
  max-width: 400px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
}
.vehicle-detail-panel {
  width: 100%;
  max-width: 450px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  background-color: white;
}
.map-area {
  flex-grow: 1;
  position: relative;
}
</style>

