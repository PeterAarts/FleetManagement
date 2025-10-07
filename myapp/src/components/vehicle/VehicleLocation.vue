<!-- VehicleLocation.vue -->
<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  vehicle: Object,
  compact: { type: Boolean, default: false }
});

const address = ref('');
const isLoadingAddress = ref(false);
const addressError = ref(false);

const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;

// Check if we have valid coordinates
const hasValidCoordinates = computed(() => {
  return props.vehicle?.location?.latitude && 
         props.vehicle?.location?.longitude &&
         props.vehicle.location.latitude !== 0 &&
         props.vehicle.location.longitude !== 0;
});

const formatAddress = (addressText) => {
  if (!addressText) return 'Address not available';
  // If address is too long, truncate it nicely
  return addressText.length > 60 ? addressText.substring(0, 57) + '...' : addressText;
};

const fetchAddress = async (latitude, longitude) => {
  if (!latitude || !longitude || latitude === 0 || longitude === 0) {
    address.value = 'Address not available';
    return;
  }

  isLoadingAddress.value = true;
  addressError.value = false;
  address.value = '';

  try {
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&type=street&language=eng&limit=1&apiKey=${HERE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0 && data.items[0].address) {
      address.value = data.items[0].address.label;
    } else {
      throw new Error('No address found');
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    addressError.value = true;
    address.value = 'Unable to retrieve location, service unavailable';
  } finally {
    isLoadingAddress.value = false;
  }
};

// Watch for changes in vehicle coordinates
watch(
  () => [props.vehicle?.location?.latitude, props.vehicle?.location?.longitude],
  ([newLat, newLng]) => {
    if (hasValidCoordinates.value) {
      fetchAddress(newLat, newLng);
    } else {
      address.value = 'Address not available';
    }
  },
  { immediate: true }
);

// Also fetch on component mount if coordinates are available
onMounted(() => {
  if (hasValidCoordinates.value) {
    fetchAddress(
      props.vehicle.location.latitude, 
      props.vehicle.location.longitude
    );
  }
});
</script>

<template>
  <div class="bg-white rounded-lg p-4 shadow-sm">
    <h4 class="font-medium uppercase flex items-center gap-2 mb-4 text-gray-900">
      Last Position
    </h4>
    
    <div class="flex items-start gap-3">     
      <div class="flex-1">
        <!-- Address display -->
        <div class="mb-3">
          <div v-if="isLoadingAddress" 
               class="flex items-center gap-2">
            <div class="">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          
          <p v-else-if="addressError" 
             class="text-red-600  flex items-center gap-2">
            <i class="fa-light fa-exclamation-circle"></i>
            {{ address }}
          </p>
          
          <p v-else class="flex items-center gap-3">
             <i class="fa-light fa-map-marked-alt fa-fw text-gray-400"></i>
            <div class="text-gray-900">{{ formatAddress(address) }}</div>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

