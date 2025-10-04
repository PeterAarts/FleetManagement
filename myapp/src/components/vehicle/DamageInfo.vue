<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  vehicleId: [String, Number],
  damageCount: Number,
  cachedData: Array, // The API now returns a direct array
  compact: { type: Boolean, default: false }
});

const damageData = ref(props.cachedData || null);
const isLoading = ref(false);
const error = ref(null);

// --- NEW: Helper functions to map API data ---

// Maps numeric severity from the API to a string the template can use for styling
const mapSeverity = (level) => {
  switch (level) {
    case 0: return 'low';
    case 1: return 'medium';
    case 2: return 'high';
    default: return 'unknown';
  }
};

// Maps numeric repairStatus to a human-readable string
const mapRepairStatus = (status) => {
  switch (status) {
    case 0: return 'reported';
    case 1: return 'in_progress';
    case 2: return 'repaired';
    default: return 'unknown';
  }
};


// --- MODIFIED: fetchDamageData now uses the real API and transforms the data ---
const fetchDamageData = async () => {
  if (!props.vehicleId) return;
  if (props.cachedData) {
    damageData.value = props.cachedData;
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    // This now calls your live API endpoint
    const response = await fetch(`/api/vehicles/${props.vehicleId}/damage`);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    const rawData = await response.json();
    
    // Transform the raw API data into the format the template expects
    damageData.value = rawData.map(d => ({
        id: d.id,
        description: d.description,
        severity: mapSeverity(d.severity),
        date: `${d.createdDate} ${d.createdTime.substring(0, 5)}`,
        status: mapRepairStatus(d.repairStatus),
        // Combine category and subcategory for the location, handling null subcategories
        location: d.subcategory ? `${d.category} / ${d.subcategory}` : d.category
    }));

  } catch (err) {
    error.value = 'Failed to load damage data';
    console.error('Error fetching damage data:', err);
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.cachedData, (newData) => {
  if (newData) {
    damageData.value = newData;
  }
});

// Fetch data if not cached
if (!props.cachedData) {
  fetchDamageData();
}
</script>

<template>
  <div class="bg-white rounded-lg p-4 shadow-sm">
    <div class="font-medium uppercase flex items-center mb-4 gap-2 text-gray-900">Vehicle-Check Damages </div>
    
    <div v-if="isLoading" class="flex justify-center items-center h-16">
      <i class="fa-light fa-spinner-third fa-spin text-primary text-lg"></i>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-sm">
      {{ error }}
    </div>
    
    <div v-else-if="damageData">
      <div v-if="damageData.length === 0" class="bg-gray-100 p-4 rounded text-center text-gray-600">
        No open damage reports found.
      </div>
      <div v-else class="space-y-3">
        <div v-for="damage in damageData" :key="damage.id" 
             class="p-3 border rounded-lg">
          <div class="flex justify-between items-start">
            <p class="font-medium text-sm"
               :class="{
                 'text-red-800': damage.severity === 2,
                 'text-yellow-600': damage.severity === 1,
                 'text-gray-800': damage.severity === 0
               }">
               <i class="fa-solid fa-screwdriver-wrench"></i> 
              {{ damage.damage }} 
              
            </p>
          </div>
          <div class="flex justify-between items-start mb-2">
             <p v-if="damage.driverDescription" class="text-xs italic mt-1">
              <i class="fa-light fa-user"></i>
              <span> - {{ damage.driverDescription }}</span>
            </p>  
            
          </div>
          <div class="flex justify-between items-center text-xs text-gray-600">
            <span class="flex items-center gap-1">
              {{ damage.category }} / {{ damage.subcategory }}
            </span>
            <span class="flex items-center gap-1">
              <i class="fa-light fa-clock"></i>
              {{ damage.createdDate }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>