<script setup>
import { ref, watch, computed } from 'vue';
import TPMSVisualization from '@/components/vehicle/TPMSVisualization.vue';

const props = defineProps({
  vehicleId: [String, Number],
  cachedData: [Object, Array],
  compact: { type: Boolean, default: false }
});

const tpmsData = ref(props.cachedData || null);
const isLoading = ref(false);
const error = ref(null);

watch(() => props.cachedData, (newData) => {
  if (newData) {
    tpmsData.value = newData;
  }
});

/**
 * A helper function to transform the raw API data into the shape
 * expected by the TPMSVisualization component.
 */
const transformApiData = (rawData) => {
  if (!rawData) return null;

  // 1. Calculate the number of issues from the sensors array
  const issues = rawData.sensors.filter(sensor => sensor.alert === true).length;
  
  // 2. Format the timestamp into a simple HH:MM string
  const lastUpdate = new Date(rawData.lastUpdateDateTime).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 3. Return a new object combining original and calculated data
  return {
    ...rawData, // Pass through all original data (sensors, device, countFrontAxel, etc.)
    issues,      // Add the calculated issues count
    lastUpdate,  // Add the formatted lastUpdate time
  };
};


// MODIFIED: Computed property now finds AND transforms the vehicle data
const vehicleTpms = computed(() => {
  if (!tpmsData.value || !Array.isArray(tpmsData.value)) return null;
  const vehicleData = tpmsData.value.find(item => item.isVehicle === 1);
  return transformApiData(vehicleData);
});

// MODIFIED: Computed property now finds AND transforms the trailer data
const trailerTpms = computed(() => {
  if (!tpmsData.value || !Array.isArray(tpmsData.value)) return null;
  const trailerData = tpmsData.value.find(item => item.isTrailer === 1);
  return transformApiData(trailerData);
});


if (!props.cachedData) {
  // fetchTPMSData(); // Your existing fetch function
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="flex justify-center items-center h-32">
      <i class="fa-light fa-spinner-third fa-spin text-primary text-xl"></i>
    </div>
    <div v-else-if="error" class="text-red-500 text-sm p-4 bg-red-50 rounded">{{ error }}</div>
    <template v-else-if="tpmsData">
      <div v-if="vehicleTpms">
        <TPMSVisualization :tpms-data="vehicleTpms" type="vehicle":front-axle-count="vehicleTpms.countFrontAxel"/>
      </div>
      <div v-if="trailerTpms">
        <TPMSVisualization :tpms-data="trailerTpms" type="trailer" :front-axle-count="trailerTpms.countFrontAxel"
        />
      </div>
    </template>
  </div>
</template>