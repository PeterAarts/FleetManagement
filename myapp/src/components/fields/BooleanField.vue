<!-- components/fields/BooleanField.vue -->
<template>
  <div :class="`col-md-${field.size || 12} mb-3`">
    <div class="form-check">
      <input
        :id="field.field"
        type="checkbox"
        :checked="modelValue === 1 || modelValue === true"
        @change="$emit('update:modelValue', $event.target.checked ? 1 : 0)"
        :disabled="field.editable !== 1"
        class="form-check-input"
      />
      <label :for="field.field" class="form-check-label">
        {{ field.label }}
      </label>
    </div>
  </div>
</template>

<script setup>
defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [Number, Boolean], default: 0 }
});
defineEmits(['update:modelValue']);
</script>