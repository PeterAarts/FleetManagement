<template>
  <div v-for="(rowFields, rowIndex) in organizedFieldRows" :key="rowIndex" class="row">
    <component
      v-for="field in rowFields"
      :key="field.field"
      :is="getFieldComponent(field)"
      :field="field"
      :model-value="formData[field.field]"
      @update:model-value="$emit('update:field', field.field, $event)"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';

const props = defineProps({
  fields: { type: Array, required: true },
  formData: { type: Object, required: true }
});

defineEmits(['update:field']);

// Field components
const StringField = defineAsyncComponent(() => import('../fields/StringField.vue'));
const NumberField = defineAsyncComponent(() => import('../fields/NumberField.vue'));
const DateField = defineAsyncComponent(() => import('../fields/DateField.vue'));
const SelectField = defineAsyncComponent(() => import('../fields/SelectField.vue'));
const WarningField = defineAsyncComponent(() => import('../fields/WarningField.vue'));

const getFieldComponent = (field) => {
  const componentMap = {
    'string': StringField,
    'email': StringField,
    'number': NumberField,
    'date': DateField,
    'select': SelectField,
    'warning': WarningField,
  };
  return componentMap[field.type] || StringField;
};

// Organize fields into internal rows based on sequence breaks
const organizedFieldRows = computed(() => {
  if (!props.fields || props.fields.length === 0) return [];
  
  const rows = [];
  let currentRow = [];
  let lastSequence = -1;

  props.fields.forEach(field => {
    const sequence = field.sequence || 1;
    
    // Start new row if sequence decreased (wraps to new row)
    if (sequence < lastSequence && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
    }
    
    currentRow.push(field);
    lastSequence = sequence;
  });

  // Push last row
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
});
</script>