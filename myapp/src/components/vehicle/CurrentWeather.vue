<!-- CurrentWeather.vue -->
<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  vehicle: Object,
  compact: { type: Boolean, default: false }
});

const weatherData = ref(null);
const isLoadingWeather = ref(false);
const weatherError = ref(false);

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_URL = import.meta.env.VITE_WEATHER_API_URL;

// Check if we have valid coordinates
const hasValidCoordinates = computed(() => {
  return props.vehicle?.location?.latitude && 
         props.vehicle?.location?.longitude &&
         props.vehicle.location.latitude !== 0 &&
         props.vehicle.location.longitude !== 0;
});

const fetchWeather = async (latitude, longitude) => {
  if (!latitude || !longitude || latitude === 0 || longitude === 0) {
    weatherData.value = null;
    return;
  }

  isLoadingWeather.value = true;
  weatherError.value = false;
  weatherData.value = null;

  try {
    const url = `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.main && data.wind) {
      weatherData.value = {
        temperature: Math.round(data.main.temp),
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        cloudCover: data.clouds?.all || 0
      };
    } else {
      throw new Error('No weather data found');
    }
  } catch (error) {
    console.error('Error fetching weather:', error);
    weatherError.value = true;
  } finally {
    isLoadingWeather.value = false;
  }
};

// Watch for changes in vehicle coordinates
watch(
  () => [props.vehicle?.location?.latitude, props.vehicle?.location?.longitude],
  ([newLat, newLng]) => {
    if (hasValidCoordinates.value) {
      fetchWeather(newLat, newLng);
    } else {
      weatherData.value = null;
    }
  },
  { immediate: true }
);

// Fetch on component mount if coordinates are available
onMounted(() => {
  if (hasValidCoordinates.value) {
    fetchWeather(
      props.vehicle.location.latitude, 
      props.vehicle.location.longitude
    );
  }
});
</script>

<template>
  <div class="bg-white rounded-lg p-4 shadow-sm">
    <h4 class="font-medium uppercase  flex items-center gap-2 mb-4 text-gray-900">
      Current Weather
    </h4>
    
    <div v-if="isLoadingWeather" class="flex items-center gap-2">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    
    <div v-else-if="weatherError" class="text-red-600 flex items-center gap-2">
      <i class="fa-light fa-exclamation-circle"></i>
      <span class="text-sm">Not able to retrieve weather, service unavailable</span>
    </div>
    
    <div v-else-if="weatherData" class="grid grid-cols-3 gap-4">
      <!-- Temperature -->
      <div class="flex items-center gap-2">
        <i class="fa-light fa-temperature-three-quarters text-gray-400 fa-fw"></i>
        <span class="text-sm text-gray-900">{{ weatherData.temperature }}°</span>
      </div>

      <!-- Wind -->
      <div class="flex items-center gap-2">
        <i class="fa-light fa-wind text-gray-400 fa-fw"></i>
        <span class="text-sm text-gray-900">{{ weatherData.windSpeed }} <small class="text-gray-500">km/h</small></span>
      </div>

      <!-- Cloud Cover -->
      <div class="flex items-center gap-2">
        <i class="fa-light fa-cloud text-gray-400 fa-fw"></i>
        <span class="text-sm text-gray-900">{{ weatherData.cloudCover }}<small class="text-gray-500">%</small></span>
      </div>
    </div>
    
    <div v-else class="text-gray-500 text-sm">
      Weather data not available
    </div>
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>