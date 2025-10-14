<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  vehicleId: [String, Number],
  cachedData: Array,
  layout: {
    type: String,
    default: 'card', // 'card' or 'table'
    validator: (value) => ['card', 'table'].includes(value)
  }
});

const rawDamageData = ref(props.cachedData || null);
const isLoading = ref(false);
const error = ref(null);

// --- HELPER FUNCTIONS ---
// Returns an object for the table view
const mapSeverityForTable = (level) => {
  switch (level) {
    case 0: return { text: 'Low', class: 'bg-gray-100 text-gray-800' };
    case 1: return { text: 'Medium', class: 'bg-orange-200 text-orange-800' };
    case 2: return { text: 'High', class: 'bg-red-200 text-red-800' };
    default: return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
  }
};

const mapRepairStatus = (status) => {
  switch (status) {
    case 0: return { text: 'Reported', class: 'text-red-600' };
    case 1: return { text: 'In Progress', class: 'text-blue-600' };
    case 2: return { text: 'Repaired', class: 'text-green-600' };
    default: return { text: 'Unknown', class: 'text-gray-500' };
  }
};

// --- Data transformation is now in a computed property ---
// This now prepares data for BOTH layouts to use
const processedDamageData = computed(() => {
  if (!rawDamageData.value) return [];
  
  return rawDamageData.value.map(d => ({
    // Fields for original card layout
    id: d.id,
    damage: d.description, // The original template used `damage` for the main text
    driverDescription: d.driverDescription,
    category: d.category,
    subcategory: d.subcategory,
    createdDate: d.createdDate,
    severity: d.severity, // Pass the raw numeric severity for the original class binding

    // --- New fields for table layout ---
    description: d.description,
    tableSeverity: mapSeverityForTable(d.severity),
    dateForTable: `${d.createdDate} ${d.createdTime.substring(0, 5)}`,
    status: mapRepairStatus(d.repairStatus),
    location: d.subcategory ? `${d.category} / ${d.subcategory}` : d.category
  }));
});


// --- fetchDamageData now only fetches RAW data ---
const fetchDamageData = async () => {
  if (!props.vehicleId) return;
  if (props.cachedData) {
    rawDamageData.value = props.cachedData;
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`/api/vehicles/${props.vehicleId}/damage`);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    rawDamageData.value = await response.json();

  } catch (err) {
    error.value = 'Failed to load damage data';
    console.error('Error fetching damage data:', err);
  } finally {
    isLoading.value = false;
  }
};

// --- Watcher updates the raw data ref ---
watch(() => props.cachedData, (newData) => {
  if (newData) {
    rawDamageData.value = newData;
  }
});

// Fetch data only if it's not passed in as a prop
if (!props.cachedData) {
  fetchDamageData();
}
</script>

<template>
  <div>
    <!-- Loading and Error States (shared for all layouts) -->
    <div v-if="isLoading" class="flex justify-center items-center h-24">
      <i class="fa-light fa-spinner-third fa-spin text-primary text-xl"></i>
    </div>
    <div v-else-if="error" class="text-red-500 text-sm p-4 bg-red-50 rounded">
      {{ error }}
    </div>
    
    <!-- No Data State -->
    <div v-else-if="!processedDamageData || processedDamageData.length === 0" class="bg-gray-100 p-4 rounded text-center text-gray-600">
      No open damage reports found.
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- == Layout 1: Card (For VehicleDetailPanel) - RESTORED ORIGINAL LAYOUT == -->
      <div v-if="layout === 'card'" class="card rounded-lg p-4 shadow-sm">
        <div class="font-medium uppercase flex items-center mb-4 gap-2 text-gray-900">Vehicle-Check Damages</div>
        <div v-for="damage in processedDamageData" :key="damage.id" 
             class="p-3 border-b last:border-b-0 hover:bg-secondary-200">
          <div class="flex justify-between items-start">
            <p class="font-medium "
               :class="{
                 'text-red-800': damage.severity === 2,
                 'text-orange-600': damage.severity === 1,
                 'text-gray-800': damage.severity === 0
               }">
               <i class="fa-solid fa-screwdriver-wrench"></i> 
              {{ damage.damage }}
            </p>
          </div>
          <div class="flex justify-between items-start mb-2">
             <p v-if="damage.driverDescription" class="text-xs mt-1">
              <i class="fa-light fa-user"></i>
              <span> - {{ damage.driverDescription }}</span>
            </p>  
          </div>
          <div class="flex justify-between items-center text-xs text-gray-600">
            <span class="flex items-center gap-1">
              {{ damage.category }} / {{ damage.subcategory }}
            </span>
            <span class="flex items-center gap-1">
              <i class="fa-light fa-calendar"></i>
              {{ damage.createdDate }}
            </span>
          </div>
        </div>
      </div>

      <!-- == Layout 2: Table (For ResourceDetailModal) == -->
      <div v-else-if="layout === 'table'" class="bg-white rounded-lg p-4">
        <h3 class="font-medium uppercase text-gray-900 mb-4">Damage Reports</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="text-xs">
              <tr>
                <th scope="col" class="p-3 text-left text-xs font-medium text-gray-500 ">Description</th>
                <th scope="col" class="p-3 text-left text-xs font-medium text-gray-500 ">Location</th>
                <th scope="col" class="p-3 text-left text-xs font-medium text-gray-500 ">Date Reported</th>
                <th scope="col" class="p-3 text-left text-xs font-medium text-gray-500 ">Severity</th>
                <th scope="col" class="p-3 text-left text-xs font-medium text-gray-500 ">Info</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="damage in processedDamageData" :key="damage.id" class="hover:bg-gray-200">
                <td class="p-3 whitespace-nowrap  text-gray-900">{{ damage.description }}</td>
                <td class="p-3 whitespace-nowrap  text-gray-500">{{ damage.location }}</td>
                <td class="p-3 whitespace-nowrap  text-gray-500">{{ damage.dateForTable }}</td>
                <td class="p-3 whitespace-nowrap ">
                   <span class="font-semibold px-2 py-1 rounded-full text-xs" :class="damage.tableSeverity.class">
                     {{ damage.tableSeverity.text }}
                   </span>
                </td>
                <td class="p-3 whitespace-nowrap  font-semibold" :class="damage.status.class">{{ damage.driverDescription}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
