<!-- components/fields/DateTimeField.vue -->
<template>
  <div :class="`col-md-${field.size || 12} mb-3`">
    <label :for="field.field" class="form-label text-sm">
      {{ field.label }}
    </label>
    <input
      :id="field.field"
      type="datetime-local"
      :value="formattedDateTime"
      @input="$emit('update:modelValue', $event.target.value)"
      :readonly="field.editable !== 1"
      class="form-control form-control-sm"
      :class="{ 'bg-light': field.editable !== 1 }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Date], default: '' }
});

defineEmits(['update:modelValue']);

const formattedDateTime = computed(() => {
  if (!props.modelValue) return '';
  
  // MySQL datetime format: 2025-10-01 16:06:23
  // HTML datetime-local format: 2025-10-01T16:06
  
  const dateStr = String(props.modelValue);
  
  // If already in correct format, return it
  if (dateStr.includes('T')) {
    return dateStr.substring(0, 16); // Truncate seconds
  }
  
  // Convert MySQL format to HTML format
  return dateStr.replace(' ', 'T').substring(0, 16);
});
</script>