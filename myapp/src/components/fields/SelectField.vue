<!-- components/fields/SelectField.vue -->
<template>
  <div :class="`col-md-${field.size || 12} mb-3`">
    <label :for="field.field" class="form-label text-sm">
      {{ field.label }}
    </label>
    <select
      :id="field.field"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      :disabled="field.editable !== 1"
      class="form-select form-select-sm"
      :class="{ 'bg-light': field.editable !== 1 }"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.text }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Number], default: '' }
});

defineEmits(['update:modelValue']);

const options = computed(() => {
  if (!props.field.value) return [];
  
  try {
    const parsed = JSON.parse(props.field.value);
    
    // Array format: [{value: 'x', text: 'X'}, ...] or ['x', 'y', 'z']
    if (Array.isArray(parsed)) {
      return parsed.map(opt => {
        if (typeof opt === 'object' && opt.value !== undefined) {
          return { value: opt.value, text: opt.text || opt.value };
        }
        return { value: opt, text: opt };
      });
    }
    
    // Object format: {key: 'value', ...}
    if (typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, val]) => ({
        value: key,
        text: val
      }));
    }
  } catch (e) {
    console.warn('Failed to parse select options:', props.field.value);
  }
  
  return [];
});
</script>