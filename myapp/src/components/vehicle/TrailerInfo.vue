<!-- TrailerInfo.vue -->
<script setup>
import { computed } from 'vue';

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

// Transform API data to component-friendly format
const trailer = computed(() => {
  if (!props.cachedData) return null;
  
  const data = props.cachedData;
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
    
    // Cooling status
    cooling: data.currentCoolingStatus,
    
    // Raw data for debugging
    _raw: data
  };
});

const updateField = (field, value) => {
  if (props.mode === 'edit') {
    emit('update:trailer', { ...trailer.value, [field]: value });
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

  <!-- Card Layout (Map View) -->
  <div v-else-if="layout === 'card'" class="space-y-4">
    <!-- Trailer Basic Data -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <div class="card-title font-medium  uppercase  text-gray-900 mb-4">Trailer Data</div>
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
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <div class="card-title font-medium uppercase  text-gray-900 mb-4">Maintenance</div>
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
    <div class="bg-white rounded-lg p-4 shadow-sm" v-if="Object.keys(trailer.temperature).length > 0">
      <h4 class="card-title font-medium uppercase text-gray-900 mb-4">Temperature</h4>
      <div class="flex gap-2">
        <div v-for="(temp, area) in trailer.temperature" :key="area" 
             class="px-3 py-1 rounded text-sm"
             :class="getTemperatureClass(temp)">
          <div class="text-xs text-gray-500 uppercase">{{ area.replace('_', ' ') }}</div>
          <div class="font-medium"><i class="fa-light fa-temperature-full"></i> {{ temp }}°</div>
        </div>
      </div>
    </div>

    <!-- Door Control -->
    <div class="bg-white rounded-lg p-4 shadow-sm" v-if="Object.keys(trailer.doors).length > 0">
      <div class="card-title font-medium uppercase text-gray-900 mb-4">Door Control</div>
      <div class="flex gap-2">
        <div v-for="(status, door) in trailer.doors" :key="door"
             class="px-3 py-1 rounded text-sm"
             :class="getDoorClass(status)">
          <div class="text-xs text-gray-500 lowercase">{{ door.replace('_', ' ') }}</div>
          <div class="font-medium text-xs lowercase">{{ status }}</div>
        </div>
      </div>
    </div>

    <!-- Telematics Status -->
    <div class="bg-white rounded-lg p-4 shadow-sm" v-if="Object.keys(trailer.telematics).length > 0">
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

  <!-- Form Layout (Resources View) -->
  <div v-else-if="layout === 'form'" class="space-y-6">
    <div class="bg-white rounded-lg p-6">
      <h3 class="font-bold uppercase  text-gray-700 mb-6">Trailer Details</h3>
      
      <!-- Basic Info Grid -->
      <div class="grid grid-cols-4 gap-6 mb-8">
        <div>
          <label class="block text-xs text-gray-500 mb-1">trailer name</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.name || ''"
            @input="updateField('name', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.name || 'N/A' }}</span>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">brand</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.brand || ''"
            @input="updateField('brand', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.brand || 'N/A' }}</span>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">model</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.model || ''"
            @input="updateField('model', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.model || 'N/A' }}</span>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">vin</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.vin || ''"
            @input="updateField('vin', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.vin || 'N/A' }}</span>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-6 mb-8">
        <div>
          <label class="block text-xs text-gray-500 mb-1">license plate</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.licensePlate || ''"
            @input="updateField('licensePlate', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.licensePlate || 'N/A' }}</span>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">axles configuration</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.axlesConfig || ''"
            @input="updateField('axlesConfig', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.axlesConfig || 'N/A' }}</span>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">service distance</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.serviceDistance || ''"
            @input="updateField('serviceDistance', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.serviceDistance || 'N/A' }}</span>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">ambient air temperature</label>
          <input 
            v-if="mode === 'edit'"
            :value="trailer.ambientTemp || ''"
            @input="updateField('ambientTemp', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span v-else class="text-sm font-medium text-blue-600">{{ trailer.ambientTemp || 'N/A' }}</span>
        </div>
      </div>

      <!-- Temperature, Door Control, Telematics Grid -->
      <div class="grid grid-cols-3 gap-8 mb-8">
        <!-- Temperature Section -->
        <div class="bg-gray-50 p-4 rounded" v-if="Object.keys(trailer.temperature).length > 0">
          <h4 class="font-bold text-xs uppercase  text-gray-900 mb-3">Temperature</h4>
          <div class="space-y-2">
            <div v-for="(temp, area) in trailer.temperature" :key="area" class="flex justify-between">
              <span class="text-xs text-gray-500 uppercase">{{ area.replace('_', ' ') }}</span>
              <span class="text-sm font-medium px-2 py-1 rounded"
                    :class="getTemperatureClass(temp)">
                {{ temp }}°
              </span>
            </div>
          </div>
        </div>

        <!-- Door Control Section -->
        <div class="bg-gray-50 p-4 rounded" v-if="Object.keys(trailer.doors).length > 0">
          <h4 class="font-bold  uppercase  text-gray-900 mb-3">Door Control</h4>
          <div class="space-y-2">
            <div v-for="(status, door) in trailer.doors" :key="door" class="flex justify-between">
              <span class="text-xs text-gray-500 uppercase">{{ door.replace('_', ' ') }}</span>
              <span class="text-sm font-medium px-2 py-1 rounded"
                    :class="getDoorClass(status)">
                {{ status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Telematics Section -->
        <div class="bg-gray-50 p-4 rounded" v-if="trailer.telematicsBrand">
          <h4 class="font-bold uppercase text-gray-900 mb-3">Telematics Status</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-xs text-gray-500 uppercase">Brand</span>
              <span class="text-sm font-medium">{{ trailer.telematicsBrand }}</span>
            </div>
            <div v-if="trailer.battery" class="flex justify-between">
              <span class="text-xs text-gray-500 uppercase">Battery</span>
              <span class="text-sm font-medium" 
                    :class="parseInt(trailer.battery) < 20 ? 'text-red-600' : 'text-gray-900'">
                {{ trailer.battery }}
              </span>
            </div>
            <div v-if="trailer.gps" class="flex justify-between">
              <span class="text-xs text-gray-500 uppercase">GPS</span>
              <span class="text-sm font-medium">{{ trailer.gps }}</span>
            </div>
            <div v-if="trailer.gsm" class="flex justify-between">
              <span class="text-xs text-gray-500 uppercase">GSM</span>
              <span class="text-sm font-medium">{{ trailer.gsm }}</span>
            </div>
            <div v-if="trailer.lastUpdated" class="flex justify-between">
              <span class="text-xs text-gray-500 uppercase">Updated</span>
              <span class="text-sm font-medium">{{ trailer.lastUpdated }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Inline Layout (List items) -->
  <div v-else-if="layout === 'inline'" class="text-sm">
    <div class="flex items-center gap-4">
      <span class="font-medium">{{ trailer.name || 'Unknown Trailer' }}</span>
      <span class="text-gray-500">{{ trailer.brand }} {{ trailer.model }}</span>
      <span class="text-gray-500">{{ trailer.licensePlate }}</span>
    </div>
  </div>
</template>