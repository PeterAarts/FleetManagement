<template>
  <div class="p-4 sm:p-6 ">
    <div class="text font-bold mb-4">Vehicles</div>
    
    <DataTable
      v-if="!isLoading"
      :columns="columns"
      :data="vehicles"
      :is-loading="isLoading"
      :items-per-page="paginationData.itemsPerPage"
      :total-items="paginationData.totalItems"
      :can-edit="vehiclesStore.canEdit"
      :can-delete="vehiclesStore.canDelete"
      v-model:searchQuery="search"
      v-model:page="currentPage"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      @sort="handleSort"
      @edit="handleEdit"
      @delete="handleDelete"
    >
      <template #cell-fuelLevel="{ value }">
        <div class="w-10 bg-gray-100 rounded-full h-2 ">
          <div class="bg-gray-600 h-2 rounded-full" :title="`${value}%`"   :style="{ width: value + '%' }"></div>
        </div>
      </template>
      <template #cell-catalystFuelLevel="{ value }">
        <div class="w-10 bg-gray-100 rounded-full h-2 ">
          <div class="bg-gray-600 h-2 rounded-full" :title="`${value}%`"   :style="{ width: value + '%' }"> </div>
        </div>
        
      </template>      
    </DataTable>
    <div v-else class="text-center text-gray-500 p-8">
      Loading vehicles...
    </div>
    <!-- Generic Modal - formBuild comes from database! -->
    <ResourceDetailModal
        :show="showModal"
        :data="currentResource || {}"
        :form-build="formBuild"
        :config="vehicleModalConfig"
        :is-loading="isLoadingDetails"
        @close="closeModal"
        @save="saveResource"
      />

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import { useResourceDetail } from '@/composables/useResourceDetail';
import { vehicleModalConfig } from '@/config/modalConfigs';
import DataTable from '@/components/ui/DataTable.vue';
import ResourceDetailModal from '@/components/ui/ResourceDetailModal.vue';

const router = useRouter();
const vehiclesStore = useVehiclesStore();
const settingsStore = useSettingsStore();

// Reactive state from store
const { vehicles: vehicles, isLoading } = storeToRefs(vehiclesStore);
// ensure vehicles are fetched on mount and refreshed frequently
useAutoRefresh(vehiclesStore.fetchVehicles, settingsStore.vehiclesRefreshRate);

// Local state for the datatable
const search = ref('');
const currentPage = ref(1);
const sortBy = ref('customerVehicleName'); // Default sort column
const sortOrder = ref('asc'); // Default sort order
const paginationData = computed(() => {
  const totalItems = vehicles.value?.length || 0;
  const itemsPerPage = settingsStore.paginationLimit || 1;
  const maxPage = Math.ceil(totalItems / itemsPerPage) || 1;

  // Ensure currentPage is within the valid range
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
  }

  return {
    totalItems,
    itemsPerPage
  };
});

// Use database-driven composable
const {
  showModal,
  currentResource,
  formBuild,
  isLoading: isLoadingDetails,
  fetchDetails,
  saveResource,
  closeModal,
  deleteResource
} = useResourceDetail('vehicles', vehicleModalConfig); // 'vehicles' matches your database table

// Columns definition
const columns = [
  { key: 'customerVehicleName', label: 'Vehicle Name', sortable: true },
  { key: 'licensePlate', label: 'License Plate', sortable: true },
  { key: 'trailerName', label: 'Trailer Name', sortable: true },
  { key: 'drivers[0].driverName', label: 'Driver Name', sortable: true },
  { key: 'odoMeter', label: 'Odometer (km)', sortable: true },
  { key: 'fuelLevel', label: 'Fuel Level (%)', sortable: true },
  { key: 'catalystFuelLevel', label: 'AdBlue Level (%)', sortable: true },
  { key: 'grossCombinationVehicleWeight', label: 'Weight (kg)', sortable: true },
  { key: 'severeDamageCount', label: 'Severe Damages', sortable: false },
  { key: 'damageCount', label: 'Damages', sortable: false },
];

// Reset page to 1 when search query changes
watch(search, () => {
  currentPage.value = 1;
});
watch(vehicles, (newVehicles) => {
  // Recalculate the max number of pages based on the new data
  const totalItems = newVehicles?.length || 0;
  const itemsPerPage = settingsStore.paginationLimit;
  const maxPage = Math.ceil(totalItems / itemsPerPage) || 1;

  // If the current page is now greater than the max number of pages, reset it to the last page.
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
  }
}, { immediate: true });

// Handlers for events from DataTable
function handleSort(key) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = key;
    sortOrder.value = 'asc';
  }
}

const handleEdit = (vehicle) => {
  fetchDetails(vehicle.id); // Fetches from /api/formbuilder/vehicles/{id}
};

function handleDelete(item) {
  console.log('Delete item:', item);
  // Example: show a confirmation modal
  // if (confirm(`Are you sure you want to delete ${item.customerVehicleName}?`)) {
  //   vehiclesStore.deleteVehicle(item.id);
  // }
}
// Listen for updates to refresh list
window.addEventListener('vehicles-updated', () => {
  vehiclesStore.fetchVehicles();
});




</script>