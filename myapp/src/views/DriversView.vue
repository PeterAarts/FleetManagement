<!-- ============================================ -->
<!-- DriversView.vue - Complete Example -->
<!-- ============================================ -->
<template>
  <div class="p-4 sm:p-6 space-y-4">
    <h1 class="text font-bold">Drivers</h1>
    
    <DataTable
      :columns="columns"
      :data="drivers"
      :is-loading="isLoading"
      @edit="handleEdit"
    />

    <ResourceDetailModal
      :show="showModal"
      :data="currentResource || {}"
      :form-build="formBuild"
      :config="driverModalConfig"
      @close="closeModal"
      @save="saveResource"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useResourceDetail } from '@/composables/useResourceDetail';
import { driverModalConfig } from '@/config/modalConfigs';
import DataTable from '@/components/ui/DataTable.vue';
import ResourceDetailModal from '@/components/ui/ResourceDetailModal.vue';
import apiClient from '@/tools/apiClient';

const route = useRoute();

// Local state for drivers list
const drivers = ref([]);
const isLoading = ref(false);

// Use database-driven composable for driver details
const {
  showModal,
  currentResource,
  formBuild,
  fetchDetails,
  saveResource,
  closeModal
} = useResourceDetail('driver', driverModalConfig); // 'driver' matches your database table

const columns = [
  { key: 'fullName', label: 'Driver Name', sortable: true },
  { key: 'tachoDriverIdentification', label: 'Tacho ID', sortable: true },
  { key: 'LastVehicle', label: 'Last Vehicle', sortable: true },
];

// Fetch drivers list
const fetchDrivers = async () => {
  isLoading.value = true;
  try {
    // You'd need to create this endpoint
    const response = await apiClient.get('/drivers');
    drivers.value = response.data;
  } catch (error) {
    console.error('Error fetching drivers:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (driver) => {
  fetchDetails(driver.id); // Fetches from /api/formbuilder/driver/{id}
};

onMounted(() => {
  fetchDrivers();
  if (route.query.id) {
    fetchDetails(route.query.id);
  }
});

// Listen for updates
window.addEventListener('driver-updated', () => {
  fetchDrivers();
});
</script>