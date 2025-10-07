<!-- NumberField.vue -->
<template>
  <div :class="`col-md-${field.size || 12}`">
    <div class="form-group mb-3">
      <label :for="field.field" class="form-label">{{ field.label }}</label>
      <input
        :id="field.field"
        type="text"
        class="form-control form-control-sm"
        :value="modelValue"
        :readonly="field.editable !== 1"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Number], default: '' }
});
defineEmits(['update:modelValue']);
</script>