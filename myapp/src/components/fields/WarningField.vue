<template>
  <div v-if="modelValue && modelValue !== ''" class="mb-3">
    <div class="bg-red-50 border border-red-100 rounded p-4 text-red-700">
      <div class="font-bold uppercase  mb-2">Warning</div>
      <div v-html="modelValue" class=""></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  field: { type: Object, required: true },
  modelValue: { type: String, default: '' }
});
</script>