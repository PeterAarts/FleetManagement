<script setup>
import { ref, computed, watch } from 'vue';
import apiClient from '@/tools/apiClient';
import VehicleBasicInfo from '@/components/vehicle/VehicleBasicInfo.vue';
import VehicleLocation from '@/components/vehicle/VehicleLocation.vue';
import CurrentWeather from '@/components/vehicle/CurrentWeather.vue';
import DriverInfo from '@/components/vehicle/DriverInfo.vue';
import TripsInfo from '@/components/vehicle/TripsInfo.vue';
import DamageInfo from '@/components/vehicle/DamageInfo.vue';
import TrailerInfo from '@/components/vehicle/TrailerInfo.vue';
import TPMSInfo from '@/components/vehicle/TPMSInfo.vue';
import GeofenceInfo from '@/components/vehicle/GeofenceInfo.vue';

const props = defineProps({
  vehicle: Object,
  variant: {
    type: String,
    default: 'full', // 'full' or 'inline'
  }
});

const emit = defineEmits(['close']);
const activeTab = ref('vehicle');

// IMPROVED: Global cache that persists across vehicle changes
const globalVehicleCache = ref(new Map());

const isLoading = ref(false);

// Extract driver IDs from vehicle data
const driverIds = computed(() => {
  const ids = [];
  if (props.vehicle?.drivers && Array.isArray(props.vehicle.drivers)) {
    props.vehicle.drivers.forEach(driver => {
      if (driver.driverId) ids.push(driver.driverId);
    });
  }
  return ids;
});

// Check if vehicle has drivers
const hasDriver = computed(() => driverIds.value.length > 0);

// Computed tabs based on vehicle data availability
const availableTabs = computed(() => {
  const vehicleIcon = props.vehicle?.typeIconClass ? `fa-light ${props.vehicle.typeIconClass}` : 'fa-light fa-truck';
  const tabs = [];
  tabs.push({ id: 'vehicle', label: '', icon: vehicleIcon, show: true }); 
  if (hasDriver.value)                {tabs.push({ id: 'driver', label: '', icon: 'fa-light fa-user', show: true });}
  tabs.push({ id: 'trips', label: '', icon: 'fa-light fa-route', show: true }); 
  if (props.vehicle?.damageCount > 0) {tabs.push({ id: 'damages', label: ``, icon: 'fa-light fa-wrench', show: true });}
  if (props.vehicle?.trailerId)       {tabs.push({ id: 'trailer', label: '', icon: 'fa-light fa-trailer', show: true });}
  if (props.vehicle?.tpmsVehicle || props.vehicle?.tpmsTrailer) 
                                      {tabs.push({ id: 'tpms', label: '', icon: 'fa-light fa-tire-pressure-warning', show: true });}
  if (props.vehicle?.geofence > 0)    {tabs.push({ id: 'geofence', label: '', icon: 'fa-light fa-draw-polygon', show: true });}                                    
  return tabs.filter(tab => tab.show);
});

// IMPROVED: Helper functions for cache management
const getCacheKey = (type, vehicleId, additionalKey = '') => {
  return `${type}-${vehicleId}${additionalKey ? `-${additionalKey}` : ''}`;
};

const getCachedData = (cacheKey) => {
  return globalVehicleCache.value.get(cacheKey);
};

const setCachedData = (cacheKey, data) => {
  globalVehicleCache.value.set(cacheKey, data);
};

// IMPROVED: API fetch functions with global persistent caching
const fetchDriverData = async (vehicleId) => {
  const cacheKey = getCacheKey('drivers', vehicleId);
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    if (!hasDriver.value) {
      throw new Error('No driver IDs available');
    }
    
    // Create an array of API call promises for each driver ID
    const driverPromises = driverIds.value.map(id => apiClient.get(`/driver/${id}`));
    
    // Fetch all driver data concurrently
    const responses = await Promise.all(driverPromises);
    
    // Extract data from responses and cache it
    const driversData = responses.map(response => response.data);
    setCachedData(cacheKey, driversData);
    
    return driversData;
  } catch (error) {
    console.error('Error fetching Driver data:', error);
    setCachedData(cacheKey, []); // Cache empty result to avoid repeated failed requests
    throw error;
  }
};

const fetchTripsData = async (vehicleId) => {
  const cacheKey = getCacheKey('trips', vehicleId);
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}/trips?limit=10`);    
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching Trips data:', error);
    throw error;
  }
};
const fetchGeofenceData = async (vehicleId) => {
  const cacheKey = getCacheKey('geofence', vehicleId);
  const cachedData = getCachedData(cacheKey);
  if (cachedData) return cachedData;
  
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}/geofence/events`);
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching Geofence data:', error);
    throw error;
  }
};
const fetchDamageData = async (vehicleId) => {
  const cacheKey = getCacheKey('damages', vehicleId);
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}/damage`);    
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching Damage data:', error);
    throw error;
  }
};
const fetchTrailerData = async (vehicleId) => {
  const cacheKey = getCacheKey('trailer', vehicleId);
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}/trailer`);    
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching Trailer data:', error);
    throw error;
  }
};
const fetchTPMSData = async (vehicleId) => {
  const cacheKey = getCacheKey('tpms', vehicleId);
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  try {
    const response = await apiClient.get(`/vehicles/${vehicleId}/tpms`);    
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching TPMS data:', error);
    throw error;
  }
};
// IMPROVED: Get cached data for current vehicle and tab
const getCurrentTabData = (tabId) => {
  if (!props.vehicle?.id) return null;
  const cacheKey = getCacheKey(tabId === 'driver' ? 'drivers' : tabId, props.vehicle.id);
  return getCachedData(cacheKey);
};
// Tab switching with lazy loading
const switchTab = async (tabId) => {
  if (activeTab.value === tabId) return;
  activeTab.value = tabId;
  
  // Check if data is already cached before showing loading
  const cachedData = getCurrentTabData(tabId);
  if (cachedData) {
    return; // Data already available, no need to load
  }
  
  isLoading.value = true;
  
  try {
    switch (tabId) {
      case 'driver':
        if (hasDriver.value) {
          await fetchDriverData(props.vehicle.id);
        }
        break;
      case 'trips':
        await fetchTripsData(props.vehicle.id);
        break;
      case 'damages':
        if (props.vehicle?.damageCount > 0) {
          await fetchDamageData(props.vehicle.id);
        }
        break;
      case 'geofence':
        if (props.vehicle?.geofence > 0) {
          await fetchGeofenceData(props.vehicle.id);
        }
        break;
      case 'trailer':
        if (props.vehicle?.trailerId) {
          await fetchTrailerData(props.vehicle.id);
        }
        break;
      case 'tpms':
        if (props.vehicle?.tpmsVehicle || props.vehicle?.tpmsTrailer) {
          await fetchTPMSData(props.vehicle.id);
        }
        break;
    }
  } catch (error) {
    console.error(`Error loading ${tabId} data:`, error);
  } finally {
    isLoading.value = false;
  }
};

// IMPROVED: Only reset active tab when vehicle changes, keep cache intact
watch(() => props.vehicle?.id, (newVehicleId, oldVehicleId) => {
  if (newVehicleId !== oldVehicleId) {
    activeTab.value = 'vehicle';
    // Note: We're NOT clearing the cache anymore - it persists across vehicles
  }
});

</script>

<template>
  <div class="flex flex-col h-full bg-secondary-100 text-gray-900 vehicle-panel" 
       :class="variant === 'full' ? '' : ' '">
    
    <!-- Header: Only shown for the full panel variant -->
    <div v-if="variant === 'full'" class="flex justify-between items-center p-4 b ">
      <div>
        <h2 class="text-xl font-bold uppercase text-gray-600">{{ vehicle.customerVehicleName }}</h2>
        <p class="text-gray-500">{{ vehicle.licensePlate }}</p>
        <p v-if="vehicle.trailerId" class="flex items-center mt-4 text-gray-600 uppercase font-bold text-sm">
            <i class="fa-light fa-trailer text-gray-400 mr-4 fa-fw"></i>{{ vehicle.trailerName }} 
        </p> 
      </div>
      <button @click="emit('close')" class="p-2 rounded-full hover:bg-gray-100 text-gray-600">
        <i class="fa-light fa-xmark text-xl"></i>
      </button>
    </div>

    <!-- Dynamic Tabs: Only for the full variant -->
    <div class="flex gap-0 px-4 border-secondary-200 border-b overflow-x-auto" v-if="variant === 'full'">
      <button 
        v-for="tab in availableTabs" 
        :key="tab.id"
        @click="switchTab(tab.id)"
        class="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative rounded-top whitespace-nowrap mr-1 rounded-t-lg"
        :class="activeTab === tab.id 
          ? 'text-primary-500 border-b-2 border-primary-500 bg-white rounded-top-left hover:bg-secondary-200' 
          : 'text-gray-500 hover:text-primary hover:bg-secondary-200'"
      >
        <i :class="[tab.icon, { 'font-bold': activeTab === tab.id }]"></i>
        {{ tab.label }}
      </button>
    </div>

    <!-- Content: Always visible -->
    <div class="flex-grow overflow-y-auto text-sm p-4 custom-scrollbar-container">
      
      <!-- Loading overlay -->
      <div v-if="isLoading" class="flex justify-center items-center h-32">
        <div class="text-center">
          <i class="fa-light fa-spinner-third fa-spin text-primary text-2xl mb-2"></i>
          <p class="text-gray-600">Loading...</p>
        </div>
      </div>

      <!-- Vehicle Tab Content -->
      <div v-else-if="activeTab === 'vehicle'" class="space-y-4">
        <VehicleBasicInfo :vehicle="vehicle" />
        <VehicleLocation :vehicle="vehicle" />
        <CurrentWeather :vehicle="vehicle" />
      </div>

      <!-- Driver Tab Content -->
      <div v-else-if="activeTab === 'driver'" class="space-y-4">
        <div v-if="getCurrentTabData('driver')"><DriverInfo v-for="(driver, index) in getCurrentTabData('driver')":key="driver.id || index":cached-data="driver" :driver-position="`DRIVER ${index + 1}`" layout="card"/></div>
        <div v-else class="text-center text-gray-500 py-8">No detailed driver information available.</div>
      </div>
      <div v-else-if="activeTab === 'trips'">   <TripsInfo    :vehicle-id="vehicle.id" :cached-data="getCurrentTabData('trips')" layout="card"/></div>
      <div v-else-if="activeTab === 'damages'"> <DamageInfo   :vehicle-id="vehicle.id" :cached-data="getCurrentTabData('damages')" layout="card"/></div>
      <div v-else-if="activeTab === 'trailer'"> <TrailerInfo  :vehicle-id="vehicle.id" :trailer-id="vehicle.trailerId" :cached-data="getCurrentTabData('trailer')" layout="card" mode="display"/></div>
      <div v-else-if="activeTab === 'tpms'">    <TPMSInfo     :vehicle-id="vehicle.id" :cached-data="getCurrentTabData('tpms')" layout="card" /></div>
      <div v-else-if="activeTab === 'geofence'"><GeofenceInfo :vehicle-id="vehicle.id" :cached-data="getCurrentTabData('geofence')" layout="card"/></div>
  </div>
</div>
</template>

<style>
/* Global but targeted styles for our custom scrollbar.
  These rules only apply to elements inside .custom-scrollbar-container 
*/
.custom-scrollbar-container::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar-container::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-container::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}
.custom-scrollbar-container:hover::-webkit-scrollbar-thumb {
  background-color: var(--color-primary-300);
}
</style>

<style scoped>
.vehicle-panel {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: var(--radius);
}
</style>