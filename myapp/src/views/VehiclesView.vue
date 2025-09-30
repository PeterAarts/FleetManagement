<template>
  <div class="p-4 sm:p-6 space-y-4">
    <h1 class="text font-bold">Vehicles</h1>
    
    <DataTable
      :columns="columns"
      :data="vehicles"
      :is-loading="isLoading"
      :items-per-page="settingsStore.paginationLimit"
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
        <div class="w-25 bg-gray-200 rounded-full h-1 ">
          <div class="bg-primary h-1 rounded-full" :title="`${value}%`"   :style="{ width: value + '%' }"></div>
        </div>
      </template>

    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAutoRefresh } from '@/composables/useAutoRefresh';
import DataTable from '@/components/ui/DataTable.vue';

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

// Handlers for events from DataTable
function handleSort(key) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = key;
    sortOrder.value = 'asc';
  }
}

function handleEdit(item) {
  console.log('Edit item:', item);
  // Example: navigate to an edit page
  // router.push({ name: 'vehicle-edit', params: { id: item.id } });
}

function handleDelete(item) {
  console.log('Delete item:', item);
  // Example: show a confirmation modal
  // if (confirm(`Are you sure you want to delete ${item.customerVehicleName}?`)) {
  //   vehiclesStore.deleteVehicle(item.id);
  // }
}




</script>