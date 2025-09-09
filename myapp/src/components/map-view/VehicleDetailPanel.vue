<script setup>
import { X, User, Route, Clock, Gauge, Fuel } from 'lucide-vue-next';

defineProps({
  vehicle: Object,
  variant: {
    type: String,
    default: 'full', // Can be 'full' or 'inline'
  }
});

const emit = defineEmits(['close']);

// Helper function to format numbers, can be moved to a utils file
const formatNumber = (num) => num ? new Intl.NumberFormat('en-US').format(num) : 'N/A';

</script>

<template>
  <div class="flex flex-col h-full text-gray-800" :class="variant === 'full' ? 'p-6' : 'p-4 bg-blue-50/50'">
    <!-- Header: Only shown for the full panel variant -->
    <div v-if="variant === 'full'" class="flex justify-between items-center pb-4 border-b mb-4">
      <div>
        <h2 class="text-xl font-bold">{{ vehicle.customerVehicleName }}</h2>
        <p class="text-gray-500">{{ vehicle.licensePlate }}</p>
      </div>
      <button @click="emit('close')" class="p-2 rounded-full hover:bg-gray-100 text-gray-600">
        <X :size="24" />
      </button>
    </div>

    <!-- Tabs: Also only for the full variant -->
    <div class="flex gap-4 border-b" v-if="variant === 'full'">
      <button class="py-2 border-b-2 border-primary font-semibold text-sm text-primary">Vehicle</button>
      <button class="py-2 text-gray-500 hover:text-primary text-sm">Driver</button>
      <button class="py-2 text-gray-500 hover:text-primary text-sm">History</button>
    </div>

    <!-- Content: Always visible -->
    <div class="flex-grow overflow-y-auto text-sm pt-4">
      <!-- Section: Last Position -->
      <div class="space-y-1">
        <h4 class="font-bold text-gray-500 text-xs uppercase tracking-wider flex items-center gap-2"><Route :size="14"/>Last Position</h4>
        <p class="font-semibold">{{ vehicle.location?.address || 'Address not available' }}</p>
        <p class="text-xs text-gray-500 flex items-center gap-2"><Clock :size="12"/>{{ vehicle.location?.lastUpdate }}</p>
      </div>

      <!-- Section: Vehicle Data -->
      <div class="mt-6 space-y-3">
        <h4 class="font-bold text-gray-500 text-xs uppercase tracking-wider flex items-center gap-2"><User :size="14"/>Vehicle Data</h4>
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-xs bg-white/50 p-3 rounded-md border">
            <div>
                <p class="text-gray-500 flex items-center gap-1.5"><Gauge :size="12"/>Odometer</p>
                <p class="font-semibold text-sm">{{ formatNumber(vehicle.odometer) }} km</p>
            </div>
             <div>
                <p class="text-gray-500 flex items-center gap-1.5"><Gauge :size="12"/>Speed</p>
                <p class="font-semibold text-sm">{{ vehicle.location?.speed || 0 }} km/h</p>
            </div>
             <div>
                <p class="text-gray-500 flex items-center gap-1.5"><Fuel :size="12"/>Fuel Level</p>
                <p class="font-semibold text-sm">{{ vehicle.fuelLevel || 'N/A' }} %</p>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

