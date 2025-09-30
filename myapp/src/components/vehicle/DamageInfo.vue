<!-- DamageInfo.vue -->
<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  vehicleId: [String, Number],
  damageCount: Number,
  cachedData: Object,
  compact: { type: Boolean, default: false }
});

const damageData = ref(props.cachedData || null);
const isLoading = ref(false);
const error = ref(null);

const fetchDamageData = async () => {
  if (!props.vehicleId) return;
  if (props.cachedData) {
    damageData.value = props.cachedData;
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    // Replace with your actual API endpoint
    // const response = await fetch(`/api/vehicles/${props.vehicleId}/damages`);
    // const data = await response.json();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock damage data based on damage count
    if (props.damageCount > 0) {
      damageData.value = {
        hasData: true,
        damages: [
          { 
            id: 1, 
            description: 'Minor dent on left rear panel', 
            severity: 'low',
            date: '2025-09-15 14:30',
            status: 'reported',
            location: 'Left rear panel'
          },
          { 
            id: 2, 
            description: 'Scratched bumper', 
            severity: 'medium',
            date: '2025-09-10 09:15',
            status: 'under_review',
            location: 'Front bumper'
          }
        ].slice(0, props.damageCount)
      };
    } else {
      damageData.value = {
        hasData: false,
        message: 'No data available in table',
        damages: []
      };
    }
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
    <h4 class="font-bold text-xs uppercase tracking-wider flex items-center mb-4 gap-2 text-gray-600">
      <i class="fa-light fa-wrench text-gray-600"></i>
      Vehicle Check Damages
      <span v-if="damageCount" class="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
        {{ damageCount }}
      </span>
    </h4>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-16">
      <i class="fa-light fa-spinner-third fa-spin text-primary text-lg"></i>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="text-red-500 text-sm">
      {{ error }}
    </div>
    
    <!-- Damage Data -->
    <div v-else-if="damageData">
      <div v-if="!damageData.hasData" class="bg-gray-100 p-4 rounded text-center text-gray-600">
        {{ damageData.message }}
      </div>
      <div v-else class="space-y-3">
        <div v-for="damage in damageData.damages" :key="damage.id" 
             class="p-3 border rounded-lg"
             :class="{
               'border-red-200 bg-red-50': damage.severity === 'high',
               'border-yellow-200 bg-yellow-50': damage.severity === 'medium', 
               'border-gray-200 bg-gray-50': damage.severity === 'low'
             }">
          <div class="flex justify-between items-start mb-2">
            <p class="font-medium text-sm"
               :class="{
                 'text-red-800': damage.severity === 'high',
                 'text-yellow-800': damage.severity === 'medium',
                 'text-gray-800': damage.severity === 'low'
               }">
              {{ damage.description }}
            </p>
            <span class="text-xs px-2 py-1 rounded-full"
                  :class="{
                    'bg-red-100 text-red-600': damage.severity === 'high',
                    'bg-yellow-100 text-yellow-600': damage.severity === 'medium',
                    'bg-gray-100 text-gray-600': damage.severity === 'low'
                  }">
              {{ damage.severity }}
            </span>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-600">
            <span class="flex items-center gap-1">
              <i class="fa-light fa-map-marker-alt"></i>
              {{ damage.location }}
            </span>
            <span class="flex items-center gap-1">
              <i class="fa-light fa-clock"></i>
              {{ damage.date }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>