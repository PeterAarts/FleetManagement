<script setup>
import { ref, computed } from 'vue';
import { Search, ChevronDown, ChevronRight, ArrowRight } from 'lucide-vue-next';
import VehicleDetailPanel from './VehicleDetailPanel.vue';

const props = defineProps({
  vehicles: Array,
  selectedVehicleId: [Number, String],
});

const emit = defineEmits(['vehicle-selected', 'open-full-details']);

const searchTerm = ref('');
const openGroups = ref({});

const filteredVehicles = computed(() => {
    if (!searchTerm.value) {
        return props.vehicles;
    }
    return props.vehicles.filter(vehicle => {
        const term = searchTerm.value.toLowerCase();
        const nameMatch = vehicle.customerVehicleName?.toLowerCase().includes(term);
        const driverMatch = vehicle.drivers?.[0]?.driverName?.toLowerCase().includes(term);
        return nameMatch || driverMatch;
    });
});

const groupedVehicles = computed(() => {
  const groups = {};
  filteredVehicles.value.forEach(vehicle => {
    const groupName = vehicle.group || 'Uncategorized';
    if (!groups[groupName]) {
      groups[groupName] = [];
      if (openGroups.value[groupName] === undefined) {
          openGroups.value[groupName] = true;
      }
    }
    groups[groupName].push(vehicle);
  });
  return groups;
});

function toggleGroup(groupName) {
  openGroups.value[groupName] = !openGroups.value[groupName];
}
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <div class="p-3 border-b">
        <div class="relative">
            <input type="text" v-model="searchTerm" placeholder="Search vehicle or driver..." class="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"/>
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18"/>
        </div>
    </div>

    <div class="flex-grow overflow-y-auto">
      <div v-for="(vehicleList, groupName) in groupedVehicles" :key="groupName" class="border-b">
        <div @click="toggleGroup(groupName)" class="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">{{ groupName }} ({{ vehicleList.length }})</h3>
          <ChevronDown v-if="openGroups[groupName]" :size="16" class="text-gray-500" />
          <ChevronRight v-else :size="16" class="text-gray-500" />
        </div>
        
        <ul v-if="openGroups[groupName]">
          <li
            v-for="vehicle in vehicleList"
            :key="vehicle.id"
            class="border-t"
            :class="{ 'bg-blue-50': vehicle.id === selectedVehicleId }"
          >
            <div @click="emit('vehicle-selected', vehicle)" class="p-3 hover:bg-gray-100 flex justify-between items-center cursor-pointer">
              <div>
                <div class="font-semibold text-sm">{{ vehicle.customerVehicleName }}</div>
                <div class="text-xs text-gray-600">{{ vehicle.drivers?.[0]?.driverName || 'No driver assigned' }}</div>
              </div>
               <button @click.stop="emit('open-full-details', vehicle)" title="Open full details" class="p-1 text-gray-400 hover:text-blue-600">
                  <ArrowRight :size="16" />
               </button>
            </div>
            
            <!-- Inline Detail Panel -->
            <div v-if="vehicle.id === selectedVehicleId" class="border-t border-blue-200">
              <VehicleDetailPanel :vehicle="vehicle" variant="inline" />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

