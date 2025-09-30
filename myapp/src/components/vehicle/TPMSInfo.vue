<!-- TPMSInfo.vue -->
<script setup>
import { ref, watch } from 'vue';
import TPMSVisualization from '@/components/vehicle/TPMSVisualization.vue';

const props = defineProps({
  vehicleId: [String, Number],
  cachedData: Object,
  compact: { type: Boolean, default: false }
});

const tpmsData = ref(props.cachedData || null);
const isLoading = ref(false);
const error = ref(null);

// Your existing fetch logic here...

watch(() => props.cachedData, (newData) => {
  if (newData) {
    tpmsData.value = newData;
  }
});

if (!props.cachedData) {
  // fetchTPMSData(); // Your existing fetch function
}
</script>

<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-32">
      <i class="fa-light fa-spinner-third fa-spin text-primary text-xl"></i>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="text-red-500 text-sm p-4 bg-red-50 rounded">
      {{ error }}
    </div>
    
    <!-- TPMS Data -->
    <template v-else-if="tpmsData">
      <!-- Vehicle TPMS -->
      <div v-if="tpmsData.vehicle?.available">
        <h4 class="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">Vehicle</h4>
        <TPMSVisualization :tpms-data="tpmsData.vehicle" type="vehicle" />
      </div>

      <!-- Trailer TPMS -->
      <div v-if="tpmsData.trailer?.available">
        <h4 class="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">Trailer</h4>
        <TPMSVisualization :tpms-data="tpmsData.trailer" type="trailer" />
      </div>
    </template>
  </div>
</template>