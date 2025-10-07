<!-- components/fields/DateField.vue -->
<template>
  <div :class="`col-md-${field.size || 12} mb-3`">
    <label :for="field.field" class="form-label ">
      {{ field.label }}
    </label>
    <input
      :id="field.field"
      type="date"
      :value="formattedDate"
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

const formattedDate = computed(() => {
  if (!props.modelValue) return '';
  const dateStr = String(props.modelValue).split(' ')[0];
  return dateStr;
});
</script>