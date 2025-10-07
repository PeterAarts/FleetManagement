<template>
  <div class="dynamic-form card p-4 rounded">
    <div class="flex flex-wrap -mx-2">
      <!-- Main Columns Loop -->
      <div 
        v-for="colNum in sortedColumnNumbers" 
        :key="colNum"
        :class="getMainColumnClass(colNum)"
        class="px-2"
      >
        <!-- Groups Loop -->
        <template v-for="groupInfo in getGroupsForColumn(colNum)" :key="groupInfo.key">
          
          <!-- Grouped Fields -->
          <fieldset v-if="groupInfo.isGroup" class="border border-primary-50 rounded p-4 mb-4 ">
            <legend class="text-xs font-semibold uppercase text-primary-200 px-2">
              {{ groupInfo.name }}
            </legend>
            
            <!-- Rows within group -->
            <div 
              v-for="rowNum in groupInfo.rows" 
              :key="rowNum"
              class="flex flex-wrap -mx-2 mb-2 last:mb-0"
            >
              <!-- Fields in row -->
              <div 
                v-for="field in getFieldsForGroupRow(colNum, groupInfo.name, rowNum)" 
                :key="field.field"
                :class="getFieldClass(field.size || 12)"
                class="px-2 mb-3"
              >
                <div>
                  <label class="block text-xs text-gray-500 mb-1">{{ field.label }}</label>
                  <input
                    v-if="field.editable === 1"
                    type="text"
                    class="w-full px-3 py-2 font-medium border border-gray-200 bg-body rounded focus:outline-none focus:bg-gray-200 "
                    :value="localFormData[field.field]"
                    @input="updateField(field.field, $event.target.value)"
                  />
                  <div v-else class="w-full px-3 py-2 font-medium border border-gray-100 rounded text-gray-900">
                    {{ localFormData[field.field] || '&nbsp' }}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <!-- Ungrouped Fields -->
          <div v-else class="mb-4">
            <div 
              v-for="rowNum in groupInfo.rows" 
              :key="rowNum"
              class="flex flex-wrap -mx-2"
            >
              <div 
                v-for="field in getFieldsForGroupRow(colNum, null, rowNum)" 
                :key="field.field"
                :class="getFieldClass(field.size || 12)"
                class="px-2 mb-3"
              >
                <component
                  :is="getFieldComponent(field)"
                  :field="field"
                  :model-value="localFormData[field.field]"
                  @update:model-value="updateField(field.field, $event)"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
      <button 
        type="button" 
        class="px-4 py-2 bg-body text-gray-900 rounded hover:bg-secondary-500 transition"
        @click="$emit('cancel')"
      >
        Close
      </button>
      <button 
        type="button" 
        class="px-4 py-2 bg-body text-gray-900 rounded hover:bg-primary-500 hover:text-white transition"
        @click="handleSave"
      >
        Save changes
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue';

const props = defineProps({
  formBuild: { type: Array, required: true },
  data: { type: Object, required: true }
});

const emit = defineEmits(['save', 'cancel']);

const localFormData = ref(normalizeData());

const WarningField = defineAsyncComponent(() => import('../fields/WarningField.vue'));

function getFieldComponent(field) {
  if (field.type === 'warning') return WarningField;
  return null;
}

function normalizeData() {
  const normalized = {};
  const dataLookup = {};
  
  console.log('Raw data:', props.data);
  console.log('FormBuild fields:', props.formBuild.map(f => f.field));
  
  Object.keys(props.data).forEach(key => {
    dataLookup[key.toLowerCase()] = props.data[key];
  });
  
  props.formBuild.forEach(field => {
    const fieldKey = field.field;
    const fieldLower = fieldKey.toLowerCase();
    
    if (props.data.hasOwnProperty(fieldKey)) {
      normalized[fieldKey] = props.data[fieldKey];
    } else if (dataLookup.hasOwnProperty(fieldLower)) {
      normalized[fieldKey] = dataLookup[fieldLower];
      console.log(`Mapped ${fieldKey} to ${dataLookup[fieldLower]} (case-insensitive)`);
    } else {
      console.warn(`No data found for field: ${fieldKey}`);
      normalized[fieldKey] = null;
    }
  });
  
  console.log('Normalized data:', normalized);
  return normalized;
}

// Organize fields by column
const columnData = computed(() => {
  const data = {};
  let maxColumn = 0;

  props.formBuild.forEach(field => {
    const col = field.column || 1;
    if (col > maxColumn) maxColumn = col;

    if (!data[col]) {
      data[col] = {
        columnSize: field.columnSize,
        fields: []
      };
    }
    data[col].fields.push(field);
  });

  return { data, maxColumn };
});

const sortedColumnNumbers = computed(() => {
  return Object.keys(columnData.value.data).map(Number).sort((a, b) => a - b);
});

// Convert Bootstrap 12-column grid to Tailwind widths
function getMainColumnClass(colNum) {
  const col = columnData.value.data[colNum];
  const size = col.columnSize;
  
  if (size && size >= 1 && size <= 12) {
    return getTailwindWidth(size);
  }
  
  const maxCol = columnData.value.maxColumn;
  return maxCol > 1 ? getTailwindWidth(Math.floor(12 / maxCol)) : 'w-full';
}

function getFieldClass(size) {
  return getTailwindWidth(size);
}

// Map Bootstrap col-md-X to Tailwind width classes
function getTailwindWidth(cols) {
  const widthMap = {
    1: 'w-1/12',
    2: 'w-2/12',
    3: 'w-3/12', // or 'w-1/4'
    4: 'w-4/12', // or 'w-1/3'
    5: 'w-5/12',
    6: 'w-6/12', // or 'w-1/2'
    7: 'w-7/12',
    8: 'w-8/12', // or 'w-2/3'
    9: 'w-9/12', // or 'w-3/4'
    10: 'w-10/12',
    11: 'w-11/12',
    12: 'w-full'
  };
  
  return widthMap[cols] || 'w-full';
}

function getGroupsForColumn(colNum) {
  const fields = columnData.value.data[colNum].fields;
  const groupsMap = new Map();
  
  fields.forEach(field => {
    const groupName = field.group || null;
    const rowNum = field.row || 1;
    
    if (!groupsMap.has(groupName)) {
      groupsMap.set(groupName, {
        name: groupName,
        isGroup: groupName !== null,
        rows: new Set(),
        key: groupName || 'ungrouped'
      });
    }
    
    groupsMap.get(groupName).rows.add(rowNum);
  });
  
  const groups = Array.from(groupsMap.values());
  groups.forEach(group => {
    group.rows = Array.from(group.rows).sort((a, b) => a - b);
  });
  
  return groups;
}

function getFieldsForGroupRow(colNum, groupName, rowNum) {
  const fields = columnData.value.data[colNum].fields;
  
  return fields
    .filter(f => (f.group || null) === groupName && (f.row || 1) === rowNum)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
}

function updateField(fieldName, value) {
  localFormData.value[fieldName] = value;
}

function handleSave() {
  emit('save', localFormData.value);
}
</script>