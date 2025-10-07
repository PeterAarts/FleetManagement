<script setup>
import { ref, watch, computed } from 'vue';
import TPMSVisualization from '@/components/vehicle/TPMSVisualization.vue';

const props = defineProps({
  vehicleId: [String, Number],
  cachedData: [Object, Array],
  mode: { 
    type: String, 
    default: 'display', // 'display', 'edit', 'compact'
    validator: value => ['display', 'edit', 'compact'].includes(value)
  },
  layout: {
    type: String,
    default: 'card', // 'card', 'form', 'inline'
    validator: value => ['card', 'form', 'inline'].includes(value)
  }
});

const tpmsData = ref(props.cachedData || null);
const isLoading = ref(false);
const error = ref(null);

watch(() => props.cachedData, (newData) => {
  if (newData) {
    tpmsData.value = newData;
  }
}, { immediate: true });

/**
 * A helper function to transform the raw API data into the shape
 * expected by the TPMSVisualization component and other displays.
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
    ...rawData, 
    issues,      
    lastUpdate,  
    // Simple summary status
    summaryStatus: issues > 0 ? 'ALERT' : 'NORMAL',
    statusClass: issues > 0 ? 'bg-red-100 text-red-600 border-red-300' : 'bg-green-100 text-green-600 border-green-300'
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

// Overall summary for card/inline view
const totalIssues = computed(() => {
    let issues = 0;
    if (vehicleTpms.value) issues += vehicleTpms.value.issues;
    if (trailerTpms.value) issues += trailerTpms.value.issues;
    return issues;
});

const overallStatus = computed(() => {
    if (!vehicleTpms.value && !trailerTpms.value) return { status: 'N/A', class: 'bg-gray-100 text-gray-500' };
    if (totalIssues.value > 0) return { status: 'ALERT', class: 'bg-red-100 text-red-600' };
    return { status: 'OK', class: 'bg-green-100 text-green-600' };
});

</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center h-32">
    <i class="fa-light fa-spinner-third fa-spin text-primary text-xl"></i>
  </div>
  <div v-else-if="error" class="text-red-500 text-sm p-4 bg-red-50 rounded">{{ error }}</div>
  <div v-else-if="!tpmsData" class="text-center text-gray-500 py-8">
    No TPMS data available.
  </div>
  
  <template v-else>
    
    <!-- Card Layout (For VehicleDetailPanel / Dashboard) -->
    <div v-if="layout === 'card'" class="grid grid-cols-1 gap-4">
      <div v-if="vehicleTpms" class="bg-white rounded-lg  ">
        <TPMSVisualization 
          :tpms-data="vehicleTpms" 
          type="Vehicle"
          :front-axle-count="vehicleTpms.countFrontAxel"
        />
      </div>
      <div v-if="trailerTpms" class="bg-white rounded-lg ">
        <TPMSVisualization 
          :tpms-data="trailerTpms" 
          type="Trailer" 
          :front-axle-count="trailerTpms.countFrontAxel"
        />
      </div>
      <div v-if="!vehicleTpms && !trailerTpms" class="text-sm text-gray-500 text-center py-2">
          No TPMS devices connected.
      </div>
    </div>

    <!-- Form Layout (For ResourceDetailModal / Full View) -->
    <div v-else-if="layout === 'form'" class=" grid grid-cols-3 gap-4">
      <div v-if="vehicleTpms" class="bg-white rounded-lg ">
        <TPMSVisualization 
          :tpms-data="vehicleTpms" 
          type="Vehicle"
          :front-axle-count="vehicleTpms.countFrontAxel"
        />
      </div>
      <div v-if="trailerTpms" class="bg-white rounded-lg ">
        <TPMSVisualization 
          :tpms-data="trailerTpms" 
          type="Trailer" 
          :front-axle-count="trailerTpms.countFrontAxel"
        />
      </div>
      <div v-if="!vehicleTpms && !trailerTpms" class="text-sm text-gray-500 text-center py-4">
          No detailed TPMS information available.
      </div>
    </div>

    <!-- Inline Layout (For compact list item display) -->
    <div v-else-if="layout === 'inline'" class="flex items-center gap-3 text-sm">
      <i class="fa-light fa-tire-pressure-warning text-gray-500"></i>
      <span class="font-medium text-gray-900">TPMS Status:</span>
      <span 
        class="px-2 py-0.5 text-xs font-semibold rounded"
        :class="overallStatus.class"
      >
        {{ overallStatus.status }}
      </span>
      <span v-if="totalIssues > 0" class="text-red-600 text-xs">({{ totalIssues }} alerts)</span>
    </div>
  </template>
</template>
