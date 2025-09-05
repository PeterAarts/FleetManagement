<template>
  <div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead class="bg-white">
          
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            @click="column.sortable ? sortBy(column.key) : null"
            :class="{ 'sortable': column.sortable }"
            scope="col"
          >
            {{ column.label }}
            <i v-if="sortKey === column.key" class="ph-bold ms-1" :class="sortDirection === 'asc' ? 'ph-sort-ascending' : 'ph-sort-descending'"></i>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="isLoading">
          <td :colspan="columns.length" class="text-center p-4">
            <div class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="sortedData.length === 0">
          <td :colspan="columns.length" class="text-center p-4 text-muted">
            No items found.
          </td>
        </tr>
        <tr v-else v-for="item in sortedData" :key="item._id || item.id">
          <td v-for="column in columns" :key="column.key">
            <slot :name="column.key" :item="item">
              {{ getNestedValue(item, column.key) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  columns: {
    type: Array,
    required: true, // e.g., [{ key: 'name', label: 'Name', sortable: true }]
  },
  data: {
    type: Array,
    required: true, // e.g., [{ _id: 1, name: 'Product A' }]
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

// --- Sorting Logic ---
const sortKey = ref('');
const sortDirection = ref('asc');

const sortedData = computed(() => {
  if (!sortKey.value || !props.data) {
    return props.data;
  }
  // Create a shallow copy to avoid mutating the original prop array
  return [...props.data].sort((a, b) => {
    const valA = getNestedValue(a, sortKey.value);
    const valB = getNestedValue(b, sortKey.value);

    // Handle different data types for sorting
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    
    if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * (sortDirection.value === 'asc' ? 1 : -1);
    } else {
        if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
    }
  });
});

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
};

// Helper function to safely access nested object properties (e.g., 'config.mode')
const getNestedValue = (obj, path) => {
  if (!path || typeof path !== 'string') return '';
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};
</script>

<style scoped>
th.sortable {
  cursor: pointer;
  user-select: none;
}
th.sortable:hover {
  background-color: rgba(0,0,0,0.05);
}
</style>