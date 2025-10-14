<!-- TrailerInfo.vue -->
<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  vehicleId: Number,
  trailerId: Number,
  cachedData: Object,
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

const emit = defineEmits(['update:trailer']);

// Create a local, mutable copy of the raw data for edit mode
const localRawData = ref(props.cachedData);

// Watch for external changes to cachedData and update local copy
watch(() => props.cachedData, (newVal) => {
  localRawData.value = newVal;
}, { immediate: true });


// Transform API data to component-friendly format (using localRawData for reactivity)
const trailer = computed(() => {
  if (!localRawData.value) return null;
  
  const data = localRawData.value;
  const telematicsData = {
    BRAND: data.telematicsStatus?.Brand || data.brand,
    BATTERY: data.telematicsStatus?.Battery ? `${data.telematicsStatus.Battery} %` : null,
    GPS: data.telematicsStatus?.GPSsignal ? `${data.telematicsStatus.GPSsignal} %` : null,
    GSM: data.telematicsStatus?.GSMsignal ? `${data.telematicsStatus.GSMsignal} %` : null,
    UPDATED: data.telematicsStatus?.updated || null,
  };
  return {
    // Basic info
    name: data.trailerName,
    brand: data.brand,
    model: data.model,
    vin: data.vin,
    licensePlate: data.LicensePlate,
    weight: data.currentWeight,
    speed: data.currentSpeed,
    
    // Maintenance
    totalKm: data.odoMeter ? Math.floor(data.odoMeter / 1000) : null,
    serviceDistance: data.serviceDistance,
    axlesConfig: data.noOfAxles,
    ambientTemp: data.ambientAirTemperature,
    
    // Temperature data transformation
    temperature: data.currentTemperatureStatus ? 
      Object.fromEntries(
        data.currentTemperatureStatus.map(temp => [
          temp.name.toUpperCase(), 
          temp.temp
        ])
      ) : {},
    
    // Door data transformation  
    doors: data.doorData ? 
      Object.fromEntries(
        data.doorData.map(door => [
          door.name.toUpperCase().replace('-', '_'), 
          door.status.toUpperCase()
        ])
      ) : {},
    
    // Telematics data
    telematics: Object.fromEntries(
      Object.entries(telematicsData).filter(([_, value]) => value !== null)
    ),
    telematicsBrand: telematicsData.BRAND,
    battery: telematicsData.BATTERY,
    gps: telematicsData.GPS,
    gsm: telematicsData.GSM,
    lastUpdated: telematicsData.UPDATED,
    
    // Cooling status
    cooling: data.currentCoolingStatus,
    
    // Raw data for debugging
    _raw: data
  };
});

// Map computed field names back to raw data field names
const fieldMap = {
    'name': 'trailerName',
    'brand': 'brand',
    'model': 'model',
    'vin': 'vin',
    'licensePlate': 'LicensePlate',
    'axlesConfig': 'noOfAxles',
    'serviceDistance': 'serviceDistance',
    'ambientTemp': 'ambientAirTemperature'
    // Add more mappings as needed
};


const updateField = (field, value) => {
  if (props.mode === 'edit') {
    const rawFieldName = fieldMap[field];
    if (rawFieldName) {
      // 1. Update the local reactive raw data copy
      localRawData.value = { 
        ...localRawData.value, 
        [rawFieldName]: value 
      };
      
      // 2. Emit the updated raw data object to the parent
      emit('update:trailer', localRawData.value);
    } else {
      console.warn(`Attempted to edit non-mappable field: ${field}`);
    }
  }
};

// Helper to get temperature status color
const getTemperatureClass = (temp) => {
  const tempValue = parseFloat(temp);
  return tempValue > 10 ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-900 hover:bg-gray-200';
};

// Helper to get door status color
const getDoorClass = (status) => {
  return status === 'OPEN' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-900 hover:bg-gray-200';
};
const getTelematicsClass = (key, value) => {
  if (key === 'BATTERY' && parseInt(value) < 20) {
    return 'bg-red-100 text-red-600';
  }
  return 'bg-gray-100 text-gray-900 hover:bg-gray-200';
};
</script>

<template>
  <div v-if="!trailer" class="text-center text-gray-500 py-8">
    No trailer data available.
  </div>

  <!-- Card Layout (Map View) - Locked to one column as requested -->
  <div v-else-if="layout === 'card'" class="grid grid-cols-1 gap-4">
    <!-- Trailer Basic Data -->
    <div class="bg-white rounded-lg p-4 shadow-sm col-span-1">
      <div class="card-title font-medium uppercase text-gray-900 mb-4">Trailer Data</div>
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <i class="fa-light fa-truck text-gray-400"></i>
          <span class="text-gray-900">{{ trailer.brand || 'Unknown' }} - {{ trailer.model || 'Unknown' }}</span>
        </div>
        <div class="flex items-center gap-3">          
          <span class="text-gray-900">{{ trailer.weight || '-' }} kg</span>
          <i class="fa-light fa-weight-hanging text-gray-400"></i>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="fa-light fa-id-card text-gray-400"></i>
          <span class="text-gray-600">{{ trailer.licensePlate || '-' }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-gray-600">{{ trailer.speed || '0.00' }} km/u</span>
          <i class="fa-light fa-tachometer-alt text-gray-400 fa-fw"></i>
        </div>
      </div>
    </div>

    <!-- Maintenance -->
    <div class="bg-white rounded-lg p-4 shadow-sm col-span-1 ">
      <div class="card-title font-medium uppercase text-gray-900 mb-4">Maintenance</div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fa-light fa-gauge-simple-high text-gray-400"></i>
          <span class="text-gray-900">{{ trailer.totalKm || 'N/A' }} km</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-900">{{ trailer.serviceDistance || 'N/A' }} km</span>
          <i class="fa-light fa-route text-gray-400"></i>
        </div>
      </div>
    </div>

    <!-- Temperature -->
    <div class="bg-white rounded-lg p-4 shadow-sm col-span-1" v-if="Object.keys(trailer.temperature).length > 0">
      <h4 class="card-title font-medium uppercase text-gray-900 mb-4">Temperature</h4>
      <div class="flex flex-wrap gap-2">
        <div v-for="(temp, area) in trailer.temperature" :key="area" 
             class="px-3 py-1 rounded text-sm"
             :class="getTemperatureClass(temp)">
          <div class="text-xs text-gray-500 uppercase">{{ area.replace('_', ' ') }}</div>
          <div class="font-medium"><i class="fa-light fa-temperature-full"></i> {{ temp }}°</div>
        </div>
      </div>
    </div>

    <!-- Door Control -->
    <div class="bg-white rounded-lg p-4 shadow-sm col-span-1" v-if="Object.keys(trailer.doors).length > 0">
      <div class="card-title font-medium uppercase text-gray-900 mb-4">Door Control</div>
      <div class="flex flex-wrap gap-2">
        <div v-for="(status, door) in trailer.doors" :key="door"
             class="px-3 py-1 rounded text-sm"
             :class="getDoorClass(status)">
          <div class="text-xs text-gray-500 lowercase">{{ door.replace('_', ' ') }}</div>
          <div class="font-medium text-xs lowercase">{{ status }}</div>
        </div>
      </div>
    </div>

    <!-- Telematics Status -->
    <div class="bg-white rounded-lg p-4 shadow-sm col-span-1" v-if="Object.keys(trailer.telematics).length > 0">
      <h4 class="card-title font-medium uppercase text-gray-900 mb-4">Telematics Status</h4>
      <div class="flex flex-wrap gap-2">
        <div v-for="(value, key) in trailer.telematics" :key="key"
            class="px-3 py-1 rounded text-sm"
            :class="getTelematicsClass(key, value)">
          <div class="text-xs text-gray-500 lowercase">{{ key }}</div>
          <div class="font-medium text-xs flex items-center gap-1">
            <span>{{ value }}</span>
            <i v-if="key === 'BATTERY' && parseInt(value) < 20" 
              class="fa-light fa-exclamation-triangle text-red-600"></i>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Form Layout (Resources View & Modal Detail Tab) -->
  <div v-else-if="layout === 'form'" class="space-y-6">
    <div class="bg-white rounded-lg p-4">
      <h3 class="font-medium uppercase  text-gray-900 mb-4">Trailer Details</h3>
      
      <!-- Basic Info Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-4">
        <!-- Trailer Name -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Trailer Name</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.name || ''"
            @input="updateField('name', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.name || 'N/A' }}</span>
        </div>
        <!-- Brand -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Brand</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.brand || ''"
            @input="updateField('brand', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded  focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.brand || 'N/A' }}</span>
        </div>
        <!-- Model -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Model</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.model || ''"
            @input="updateField('model', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded  focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.model || 'N/A' }}</span>
        </div>
        <!-- VIN -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">VIN</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.vin || ''"
            @input="updateField('vin', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded  focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.vin || 'N/A' }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-4 border-t pt-4">
        <!-- License Plate -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">License Plate</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.licensePlate || ''"
            @input="updateField('licensePlate', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded  focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.licensePlate || 'N/A' }}</span>
        </div>
        <!-- Axles Config -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Axles Configuration</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.axlesConfig || ''"
            @input="updateField('axlesConfig', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded  focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.axlesConfig || 'N/A' }}</span>
        </div>
        <!-- Service Distance -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Service Distance (km)</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.serviceDistance || ''"
            @input="updateField('serviceDistance', $event.target.value)"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 rounded  focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.serviceDistance || 'N/A' }} km</span>
        </div>
        <!-- Ambient Air Temperature -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Ambient Air Temperature (°)</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.ambientTemp || ''"
            @input="updateField('ambientTemp', $event.target.value)"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 rounded  focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span v-else class=" font-medium text-gray-900 block">{{ trailer.ambientTemp || 'N/A' }} °</span>
        </div>
      </div>

      <!-- Live Status Grid -->
      <div class="grid md:grid-cols-3 gap-4 mb-8 border-t pt-4">
        
        <!-- Temperature Section -->
        <div class="bg-gray-50 rounded-lg p-4 shadow-sm col-span-1" v-if="Object.keys(trailer.temperature).length > 0">
          <h4 class=" font-medium uppercase text-gray-900 mb-4">Temperature</h4>
          <div class="flex flex-wrap gap-2">
            <div v-for="(temp, area) in trailer.temperature" :key="area" 
                class="px-3 py-1 rounded text-sm"
                :class="getTemperatureClass(temp)">
              <div class="text-xs text-gray-500 uppercase">{{ area.replace('_', ' ') }}</div>
              <div class="font-medium"><i class="fa-light fa-temperature-full"></i> {{ temp }}°</div>
            </div>
          </div>
        </div>

        <!-- Door Control -->
        <div class="bg-gray-50 rounded-lg p-4 shadow-sm col-span-1" v-if="Object.keys(trailer.doors).length > 0">
          <div class=" font-medium uppercase text-gray-900 mb-4">Door Control</div>
          <div class="flex flex-wrap gap-2">
            <div v-for="(status, door) in trailer.doors" :key="door"
                class="px-3 py-1 rounded text-sm"
                :class="getDoorClass(status)">
              <div class="text-xs text-gray-500 lowercase">{{ door.replace('_', ' ') }}</div>
              <div class="font-medium text-xs lowercase">{{ status }}</div>
            </div>
          </div>
        </div>

        <!-- Telematics Section -->
<!-- Telematics Status -->
        <div class="bg-gray-50 rounded-lg p-4  col-span-1" v-if="Object.keys(trailer.telematics).length > 0">
          <h4 class="font-medium uppercase text-gray-900 mb-4">Telematics Status</h4>
          <div class="flex flex-wrap gap-2">
            <div v-for="(value, key) in trailer.telematics" :key="key"
                class="px-3 py-1 rounded text-sm"
                :class="getTelematicsClass(key, value)">
              <div class="text-xs text-gray-500 lowercase">{{ key }}</div>
              <div class="font-medium text-xs flex items-center gap-1">
                <span>{{ value }}</span>
                <i v-if="key === 'BATTERY' && parseInt(value) < 20" 
                  class="fa-light fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Inline Layout (List items) -->
  <div v-else-if="layout === 'inline'" class="text-sm p-2 bg-white rounded-lg shadow-xs">
    <div class="flex items-center gap-4">
      <span class="font-medium text-blue-600">{{ trailer.name || 'Unknown Trailer' }}</span>
      <span class="text-gray-500 border-l pl-4">{{ trailer.brand }} {{ trailer.model }}</span>
      <span class="text-gray-500">{{ trailer.licensePlate }}</span>
    </div>
  </div>
</template>
