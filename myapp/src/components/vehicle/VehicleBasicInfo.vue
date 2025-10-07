<!-- VehicleBasicInfo.vue -->
<script setup>
import SteppedProgressBar from '@/components/ui/SteppedProgressBar.vue';

const props = defineProps({
  vehicle: Object,
  compact: { type: Boolean, default: false }
});

const formatNumber = (num) => num ? new Intl.NumberFormat('en-US').format(num) : 'N/A';
const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    // Format as yyyy-mm-dd hh:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    return 'Unknown';
  }
};
</script>

<template>
  <div class="bg-white rounded-lg p-4 shadow-sm">
    <h4 class="font-medium uppercase flex items-center mb-4 gap-2 text-gray-900">Vehicle Data</h4>
    
    <!-- Main vehicle info row -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-3">
        <i :class="`fa-light ${vehicle.typeIconClass}` || 'fa-light fa-truck'" class="text-gray-400 fa-fw"></i>
        <div>
          <p class="text-xs text-gray-900">{{ vehicle.brand }} {{ vehicle.model || '' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div>
          <p class="text-sm text-gray-900">{{ vehicle.currentSpeed || 0 }} km/h</p>
        </div>
        <i class="fa-light fa-tachometer-alt fa-fw text-gray-400"></i>
      </div>
    </div>
    <!-- row with odometer and weight -->
    <div class="flex items-center justify-between mb-4 ">
      <div class="flex items-center gap-3">
        <i class="fa-light fa-gauge-simple-high text-gray-400"></i>
        <div><p class="text-sm text-gray-900">{{ formatNumber(vehicle.odoMeter) }} km</p></div>
      </div>
      <div class="flex items-center gap-3">
        <div><p class="text-sm text-gray-900">{{ formatNumber(vehicle.grossCombinationVehicleWeight || 0) }} kg </p></div>
        <i class="fa-light fa-weight-hanging fa-fw text-gray-400"></i>
      </div>
    </div>
    <!-- row with fuel and license -->
    <div class="flex items-center justify-between mb-4 ">
      <div class="flex items-center gap-3">
        <i class="fa-light fa-gas-pump text-gray-400 fa-fw"></i>
        <SteppedProgressBar :percent="vehicle.fuelLevel || 0" color="var(--color-primary-500)"/>
        <span class="text-xs text-gray-500">{{ vehicle.fuelLevel || 0 }}%</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-500">{{ vehicle.catalystFuelLevel || 0 }}%</span>
        <SteppedProgressBar :percent="vehicle.catalystFuelLevel || 0" color="var(--color-primary-500)"/>
        <i class="fa-duotone fa-gas-pump text-gray-400 fa-fw"></i>
      </div>
    </div>
    <!-- Last updated timestamp -->
      <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
        <span class="text-xs text-gray-500">{{ formatDateTime(vehicle.lastActivity) }} </span>
        <i class="fa-light fa-history text-gray-400  fa-fw"></i>
      </div>

  </div>
</template>