<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class=" sm:w-1/3">
        <Input
          placeholder="Search all columns..."
          :model-value="searchQuery"
          @update:modelValue="$emit('update:searchQuery', $event)"
          class="w-50"
        />
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="exportData('excel')">Excel</Button>
        <Button variant="outline" @click="exportData('pdf')">PDF</Button>
        <Button variant="outline" @click="exportData('print')">Print</Button>
      </div>
    </div>

    <div class="border rounded-lg overflow-x-auto">
      <table class="min-w-full text-sm text-left">
        <thead class="bg-white border-b dark:bg-gray-800">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              @click="col.sortable ? $emit('sort', col.key) : null"
              scope="col"
              class="p-3 font-normal text-gray-500 bg-transparent"
              :class="{ 'cursor-pointer  dark:hover:bg-gray-700': col.sortable }"
            >
              <div class="flex items-center gap-2">
                {{ col.label }}
                <template v-if="sortBy === col.key">
                  <ArrowUp v-if="sortOrder === 'asc'" class="h-4 w-4" />
                  <ArrowDown v-else class="h-4 w-4" />
                </template>
              </div>
            </th>
            <th v-if="canEdit || canDelete" scope="col" class="p-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          <template v-if="isLoading">
            <tr v-for="i in 5" :key="`loader-${i}`">
              <td :colspan="columns.length + (canEdit || canDelete ? 1 : 0)" class="p-3">
                <Skeleton class="h-8 w-full" />
              </td>
            </tr>
          </template>
          <template v-else-if="paginatedData.length === 0">
            <tr>
              <td :colspan="columns.length + (canEdit || canDelete ? 1 : 0)" class="px-6 py-6 text-center text-gray-500">
                No results found.
              </td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="item in paginatedData" :key="item.id" class="hover:bg-primary/10 dark:hover:bg-gray-800/50 group">
              <td v-for="col in columns" :key="col.key" class="p-3 whitespace-nowrap">
                <slot :name="`cell-${col.key}`" :item="item" :value="getNestedValue(item, col.key)">
                  {{ getNestedValue(item, col.key) }}
                </slot>
              </td>
              <td v-if="canEdit || canDelete" class="p-3 text-right">
                <div class="opacity-0 group-hover:opacity-500 transition-opacity flex gap-2 justify-end text-slate-500">
                  <Button v-if="canEdit" size="sm" variant="ghost" @click="$emit('edit', item)">
                    <SquarePen class="h-4 w-4" />
                  </Button>
                  <Button v-if="canDelete" size="sm" variant="ghost" @click="$emit('delete', item)">
                    <Trash2Icon class="h-4 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

<div class="flex items-center justify-between pt-2">
  <div class="text-sm text-muted-foreground">
    Showing {{ paginatedData.length }} of {{ filteredData.length }} entries.
  </div>

   <Pagination
    v-if="totalPages > 1"
    :total="filteredData.length"
    :items-per-page="itemsPerPage"
    :page="page"
    :sibling-count="1"
    show-edges
    @update:page="$emit('update:page', $event)"
    v-slot="{ pages }"
  >
    <PaginationContent>
      <PaginationFirst />
      <PaginationPrevious />

      <template v-for="(pageNumber, index) in paginationRange">
        <PaginationItem
          v-if="typeof pageNumber === 'number'"
          :key="`page-${pageNumber}`"
          :is-active="pageNumber === page"
          @click="$emit('update:page', pageNumber)"
        >
          {{ pageNumber }}
        </PaginationItem>
        <PaginationEllipsis v-else :key="`ellipsis-${index}`" />
      </template>

      <PaginationNext />
      <PaginationLast />
      
    </PaginationContent>
  </Pagination>
</div>

    <div id="print-table-container" class="hidden"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowUp, ArrowDown, Pencil, Trash2, Trash2Icon, SquarePen } from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// PROPS
const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  // State managed by the parent
  searchQuery: { type: String, default: '' },
  sortBy: { type: String, required: true },
  sortOrder: { type: String, default: 'asc' }, // 'asc' or 'desc'
  page: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 10 },
  // Action controls
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
});

// EMITS
defineEmits(['update:searchQuery', 'update:page', 'sort', 'edit', 'delete']);

// UTILITY
const getNestedValue = (obj, path) => {
  if (!path || !obj) return '';
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};
// src/components/ui/DataTable.vue

// ... inside <script setup> ...

// ✅ ADD THIS CODE BACK
const range = (start, end) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const paginationRange = computed(() => {
  const siblingCount = 1;
  const totalPageNumbers = siblingCount + 5;

  if (totalPageNumbers >= totalPages.value) {
    return range(1, totalPages.value);
  }

  const leftSiblingIndex = Math.max(props.page - siblingCount, 1);
  const rightSiblingIndex = Math.min(
    props.page + siblingCount,
    totalPages.value
  );

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages.value - 2;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = range(1, leftItemCount);
    return [...leftRange, '...', totalPages.value];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = range(
      totalPages.value - rightItemCount + 1,
      totalPages.value
    );
    return [1, '...', ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [1, '...', ...middleRange, '...', totalPages.value];
  }
  return []; // Should not happen
});
// CORE LOGIC: Computed properties for client-side manipulation
const filteredData = computed(() => {
  if (!props.searchQuery) {
    return props.data;
  }
  const lowerCaseQuery = props.searchQuery.toLowerCase();
  return props.data.filter(item => {
    // Search in all columns defined
    return props.columns.some(col => {
      const value = getNestedValue(item, col.key);
      return String(value).toLowerCase().includes(lowerCaseQuery);
    });
  });
});

const sortedData = computed(() => {
  const sorted = [...filteredData.value];
  if (props.sortBy) {
    sorted.sort((a, b) => {
      let valA = getNestedValue(a, props.sortBy);
      let valB = getNestedValue(b, props.sortBy);

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB);
      }
      
      return String(valA).localeCompare(String(valB));
    });

    if (props.sortOrder === 'desc') {
      sorted.reverse();
    }
  }
  return sorted;
});

const paginatedData = computed(() => {
  const start = (props.page - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return sortedData.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / props.itemsPerPage);
});

// EXPORT LOGIC
const exportData = (format) => {
  const dataToExport = sortedData.value; // Export the currently sorted/filtered data
  const headers = props.columns.map(col => col.label);
  const body = dataToExport.map(item => 
    props.columns.map(col => getNestedValue(item, col.key))
  );

  if (format === 'excel') {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'data-export.xlsx');
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    doc.autoTable({
      head: [headers],
      body: body,
    });
    doc.save('data-export.pdf');
  } else if (format === 'print') {
    // Create a temporary, printable version of the table
    const printContainer = document.getElementById('print-table-container');
    const table = document.createElement('table');
    table.className = 'printable-table'; // Add a class for styling
    table.innerHTML = `
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${body.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
      </tbody>
    `;
    printContainer.innerHTML = ''; // Clear previous
    printContainer.appendChild(table);

    // Add styles for printing
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-table-container, #print-table-container * { visibility: visible; }
        #print-table-container { position: absolute; left: 0; top: 0; width: 100%; }
        .printable-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .printable-table th, .printable-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .printable-table th { background-color: #f2f2f2; }
      }
    `;
    document.head.appendChild(style);
    
    window.print();

    // Clean up
    document.head.removeChild(style);
    printContainer.innerHTML = '';
  }
};
</script>