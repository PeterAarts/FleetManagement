<script setup>
// Watch for filter changes and emit them to parent
import { ref, computed, reactive, watch } from 'vue';
import { Search, Filter, ChevronDown, ChevronRight, X } from 'lucide-vue-next';

const props = defineProps({
  vehicles: Array,
  selectedVehicleId: [Number, String],
});

const emit = defineEmits(['vehicle-selected', 'open-full-details', 'filters-updated']);

// Search and filter state
const searchTerm = ref('');
const isFilterPanelOpen = ref(false);
const openGroups = ref({});

// Filter state - local to this component
const filters = reactive({
  searchTerm: '',
  vehicleType: 'all', // 'all', 'truck', 'van', 'bus', 'car', etc.
  statuses: {
    driving: true,
    idle: true,
    stopped: true,
    rest: true,
    alert: true,
    noLocation: false,
    delayed: true,
    geofence: false,
    activeToday: false
  }
});

// Watch both searchTerm and filters and emit changes
watch([searchTerm, filters], ([newSearchTerm, newFilters]) => {
  emit('filters-updated', {
    searchTerm: newSearchTerm,
    vehicleType: newFilters.vehicleType,
    statuses: { ...newFilters.statuses }
  });
}, { deep: true, immediate: true });

// Get unique vehicle types from the data
const vehicleTypes = computed(() => {
  const types = new Set();
  props.vehicles?.forEach(vehicle => {
    if (vehicle.type) {
      types.add(vehicle.type.toUpperCase());
    }
  });
  return Array.from(types).sort();
});

// Computed counts for each status
const statusCounts = computed(() => {
  const counts = {
    driving: 0,
    idle: 0,
    stopped: 0,
    rest: 0,
    alert: 0,
    noLocation: 0,
    delayed: 0,
    geofence: 0,
    activeToday: 0
  };

  props.vehicles?.forEach(vehicle => {
    // Count based on vehicle status object
    if (vehicle.status?.driving) counts.driving++;
    if (vehicle.status?.idle || vehicle.status?.paused) counts.idle++;
    if (vehicle.status?.stopped) counts.stopped++;
    if (vehicle.status?.rest) counts.rest++;
    if (vehicle.status?.alert || vehicle.status?.error) counts.alert++;
    if (!vehicle.location?.latitude || !vehicle.location?.longitude) counts.noLocation++;
    if (vehicle.status?.delayed) counts.delayed++;
    if (vehicle.geofence > 0) counts.geofence++;
    
    // Check if active today
    if (vehicle.lastActivity && isToday(vehicle.lastActivity)) counts.activeToday++;
  });

  return counts;
});

// Helper function to check if date is today
function isToday(someDate) {
  if (!someDate) return false;
  const today = new Date();
  const dateToCompare = new Date(someDate);
  return dateToCompare.getDate() === today.getDate() &&
    dateToCompare.getMonth() === today.getMonth() &&
    dateToCompare.getFullYear() === today.getFullYear();
}

// Filtered vehicles based on search and filters
const filteredVehicles = computed(() => {
  let result = props.vehicles || [];

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter(vehicle => {
      const nameMatch = vehicle.customerVehicleName?.toLowerCase().includes(term);
      const driverMatch = vehicle.drivers?.[0]?.driverName?.toLowerCase().includes(term);
      const licenseMatch = vehicle.licensePlate?.toLowerCase().includes(term);
      const groupMatch = vehicle.memberOf?.toLowerCase().includes(term);
      return nameMatch || driverMatch || licenseMatch || groupMatch;
    });
  }

  // Apply vehicle type filter
  if (filters.vehicleType !== 'all') {
    result = result.filter(vehicle => {
      return vehicle.type?.toUpperCase() === filters.vehicleType;
    });
  }

  // Apply status filters
  result = result.filter(vehicle => {
    // If all filters are off, show nothing
    const hasActiveFilter = Object.values(filters.statuses).some(v => v);
    if (!hasActiveFilter) return false;
    
    // Check vehicle against active filters
    let matchesAnyFilter = false;
    
    if (filters.statuses.driving && vehicle.status?.driving) matchesAnyFilter = true;
    if (filters.statuses.idle && (vehicle.status?.idle || vehicle.status?.paused)) matchesAnyFilter = true;
    if (filters.statuses.stopped && vehicle.status?.stopped) matchesAnyFilter = true;
    if (filters.statuses.rest && vehicle.status?.rest) matchesAnyFilter = true;
    if (filters.statuses.alert && (vehicle.status?.alert || vehicle.status?.error)) matchesAnyFilter = true;
    if (filters.statuses.noLocation && (!vehicle.location?.latitude || !vehicle.location?.longitude)) matchesAnyFilter = true;
    if (filters.statuses.delayed && vehicle.status?.delayed) matchesAnyFilter = true;
    if (filters.statuses.geofence && vehicle.geofence > 0) matchesAnyFilter = true;
    if (filters.statuses.activeToday && vehicle.lastActivity && isToday(vehicle.lastActivity)) matchesAnyFilter = true;
    
    return matchesAnyFilter;
  });

  return result;
});

// Grouped vehicles
const groupedVehicles = computed(() => {
  const groups = {};
  
  filteredVehicles.value.forEach(vehicle => {
    const groupName = vehicle.memberOf || 'Uncategorized';
    if (!groups[groupName]) {
      groups[groupName] = [];
      if (openGroups.value[groupName] === undefined) {
        openGroups.value[groupName] = groupName === 'Uncategorized';
      }
    }
    groups[groupName].push(vehicle);
  });
  
  // Sort groups
  const sortedGroups = {};
  const groupNames = Object.keys(groups).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });
  
  groupNames.forEach(groupName => {
    sortedGroups[groupName] = groups[groupName];
  });
  
  return sortedGroups;
});

// Toggle functions
function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
}

function toggleGroup(groupName) {
  if (groupName === 'Uncategorized') return;
  openGroups.value[groupName] = !openGroups.value[groupName];
}

function setVehicleType(type) {
  filters.vehicleType = type;
}

// Reset filters to default values
function resetFilters() {
  searchTerm.value = '';
  filters.vehicleType = 'all';
  filters.statuses = {
    driving: true,
    idle: true,
    stopped: true,
    rest: true,
    alert: true,
    noLocation: false,
    delayed: true,
    geofence: false,
    activeToday: false
  };
}

// Helper function for status icons
function getVehicleStatusIcon(vehicle) {
  if (!vehicle.status) return { icon: 'fa-light fa-stop', color: 'text-gray-400' };
  
  if (vehicle.status.alert || vehicle.status.error) {
    return { icon: 'fa-light fa-triangle-exclamation', color: 'text-red-500' };
  }
  if (vehicle.status.driving) {
    return { icon: 'fa-light fa-play', color: 'text-gray-400' };
  }
  if (vehicle.status.paused || vehicle.status.work) {
    return { icon: 'fa-light fa-pause', color: 'text-gray-400' };
  }
  if (vehicle.status.stopped || vehicle.status.rest) {
    return { icon: 'fa-light fa-stop', color: 'text-gray-400' };
  }
  
  return { icon: 'fa-light fa-stop', color: 'text-gray-400' };
}

function hasDamage(vehicle) {
  return vehicle.damageCount > 0 || vehicle.severeDamageCount > 0;
}

// Get active filters count
const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.vehicleType !== 'all') count++;
  
  // Count non-default status filters
  const defaultStatuses = {
    driving: true, idle: true, stopped: true, rest: true,
    alert: true, noLocation: false, delayed: true,
    geofence: false, activeToday: false
  };
  
  Object.keys(filters.statuses).forEach(key => {
    if (filters.statuses[key] !== defaultStatuses[key]) count++;
  });
  
  return count;
});
</script>

<template>
  <div class="flex flex-col h-full bg-body overflow-hidden">
    <!-- Search and Filter Header - Fixed position -->
    <div class="p-3 rounded-xl mb-4">
      <div class="relative flex gap-2">
        <div class="flex-1 relative">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Search vehicle, driver, license plate..." 
            class="w-full pl-9 pr-4 py-2 rounded-lg text-sm  focus:outline-none focus:border-primary-500 transition-colors"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18"/>
        </div>
        <button
          @click="toggleFilterPanel"
          class="px-3 py-2 rounded-lg  transition-all"
          :class="[
            isFilterPanelOpen || activeFiltersCount > 0 
              ? 'text-gray-500 hover:bg-gray-100' 
              : 'text-gray-500 hover:bg-gray-100'
          ]"
          :title="`${isFilterPanelOpen ? 'Close' : 'Open'} filters${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ''}`"
        >
          <Filter :size="18" />
        </button>
      </div>
      <div 
        v-if="isFilterPanelOpen"
        class="filter-panel"
      >
        <div class="mt-4">
          <!-- Header with Vehicle Count and Reset Button -->
          <div class="flex items-center justify-between mb-3 ml-auto">
            <button
              
              @click="resetFilters"
              class="px-3 py-1 text-xs font-medium text-gray-600 bg-white rounded-md hover:bg-primary-500 hover:text-white transition-colors flex items-center gap-1"
              title="Reset all filters to default"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset Filters
            </button>
          </div>
          <div class="mb-4">
            <label for="vehicle-type-select" class="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select 
              id="vehicle-type-select"
              v-model="filters.vehicleType"
              class="w-full px-2 py-1 rounded-md text-sm  bg-white focus:outline-none focus:border-primary-500 transition-colors capitalize"
            >
              <option value="all">All</option>
              <option v-for="vType in vehicleTypes" :key="vType" :value="vType">
                {{ vType }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <!-- Driving -->
            <label class="flex items-center cursor-pointer hover:bg-gray-100 rounded px-2">
              <input
                type="checkbox"
                v-model="filters.statuses.driving"
                class="mr-3 h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-play text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Driving</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.driving }} ]</span>
            </label>

            <!-- Idle -->
            <label class="flex items-center cursor-pointer hover:bg-gray-100 rounded px-2">
              <input
                type="checkbox"
                v-model="filters.statuses.idle"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-pause text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Idle</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.idle }} ]</span>
            </label>

            <!-- Stopped -->
            <label class="flex items-center cursor-pointer hover:bg-gray-100 rounded px-2">
              <input
                type="checkbox"
                v-model="filters.statuses.stopped"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-stop text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Stopped</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.stopped }} ]</span>
            </label>

            <!-- Rest -->
            <label class="flex items-center cursor-pointer hover:bg-gray-100 rounded px-2">
              <input
                type="checkbox"
                v-model="filters.statuses.rest"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-bed text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Rest</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.rest }} ]</span>
            </label>

            <!-- Alert -->
            <label class="flex items-center cursor-pointer hover:bg-gray-100 rounded px-2">
              <input
                type="checkbox"
                v-model="filters.statuses.alert"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-triangle-exclamation text-red-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Alert</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.alert }} ]</span>
            </label>

            <!-- No Location -->
            <label class="flex items-center cursor-pointer hover:bg-gray-100 rounded px-2"
              :class="{ 'opacity-50 cursor-not-allowed': statusCounts.noLocation === 0 }">
              <input
                type="checkbox"
                v-model="filters.statuses.noLocation"
                :disabled="statusCounts.noLocation === 0"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-location-slash text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">No location</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.noLocation }} ]</span>
            </label>

            <!-- Delayed -->
            <label class="flex items-center  cursor-pointer hover:bg-gray-100 rounded px-2">
              <input
                type="checkbox"
                v-model="filters.statuses.delayed"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-clock text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Delayed</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.delayed }} ]</span>
            </label>

            <!-- Geofence -->
            <label class="flex items-center  cursor-pointer hover:bg-gray-100 rounded px-2"
              :class="{ 'opacity-50 cursor-not-allowed': statusCounts.geofence === 0 }">
              <input
                type="checkbox"
                v-model="filters.statuses.geofence"
                :disabled="statusCounts.geofence === 0"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-draw-polygon text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Geofence</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.geofence }} ]</span>
            </label>

            <!-- Active Today -->
            <label class="flex items-center cursor-pointer hover:bg-gray-100 rounded px-2"
              :class="{ 'opacity-50 cursor-not-allowed': statusCounts.activeToday === 0 }">
              <input
                type="checkbox"
                v-model="filters.statuses.activeToday"
                :disabled="statusCounts.activeToday === 0"
                class="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-primary-500"
              >
              <i class="fa-light fa-calendar-check text-gray-500 mr-2 w-4"></i>
              <span class="flex-1 text-sm">Active Today</span>
              <span class="text-xs text-gray-500 font-medium">[ {{ statusCounts.activeToday }} ]</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable content area -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <!-- Vehicle List -->
      <div class="bg-body">
        <!-- No vehicles message -->
        <div v-if="Object.keys(groupedVehicles).length === 0" class="p-4 text-center text-gray-500">
          <div v-if="searchTerm || activeFiltersCount > 0">
            No vehicles found matching current filters
          </div>
          <div v-else>No vehicles available</div>
        </div>

        <!-- Group sections -->
        <div v-for="(vehicleList, groupName) in groupedVehicles" :key="groupName">
          <div 
            v-if="groupName !== 'Uncategorized'"
            @click="toggleGroup(groupName)" 
            class="flex justify-between items-center px-4 py-3 cursor-pointer group hover:bg-secondary-300 border-l-2 border-blue-400"
          >
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-medium text-gray-700">
                {{ groupName }}
              </h3>
              <span class="text-xs text-gray-400">({{ vehicleList.length }})</span>
            </div>
            <ChevronDown v-if="openGroups[groupName]" :size="16" class="text-gray-400" />
            <ChevronRight v-else :size="16" class="text-gray-400" />
          </div>
          
          <div v-if="openGroups[groupName]">
            <div
              v-for="vehicle in vehicleList"
              :key="vehicle.id"
              class="flex items-center px-4 py-3 cursor-pointer hover:bg-secondary-300 listedVehicle"
              :class="{ 'bg-secondary-100 ': vehicle.id === selectedVehicleId }"
              @click="emit('vehicle-selected', vehicle)"
            >
              <div class="flex items-center justify-center w-5 h-5">
                <i :class="[getVehicleStatusIcon(vehicle).icon, getVehicleStatusIcon(vehicle).color, 'fa-fw']"></i>
              </div>
              <div class="w-5 h-5 ml-2 flex items-center justify-center">
                <i 
                  v-if="hasDamage(vehicle)"
                  class="fa-light fa-tools text-red-700 fa-fw" 
                  :title="`Vehicle has ${vehicle.damageCount || 0} damage(s), ${vehicle.severeDamageCount || 0} severe`"
                ></i>
              </div>
              <div class="flex-grow min-w-0 ml-2">
                <div class="font-medium text-gray-900  truncate">
                  {{ vehicle.customerVehicleName }} 
                  <span class="text-gray-400 text-sm font-normal">({{ vehicle.licensePlate || 'No license plate' }})</span>
                </div>
                <div class="text-xs text-gray-500 truncate mt-0.5">
                  {{ vehicle.drivers?.[0]?.driverName || 'No driver assigned' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar - thin and only visible on hover */


.hide                         {display: none; }
.listedVehicle:hover i        {font-weight: 700 !important;border-radius: var(--radius);}
.group                        {border-left:2px solid var(--color-primary-400);}
.group + div .listedVehicle   {border-left:2px solid var(--color-primary-300);margin-top:0;}

</style>