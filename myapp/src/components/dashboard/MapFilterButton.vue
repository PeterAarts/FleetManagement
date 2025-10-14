<script setup>
defineProps({
  icon: { type: [Object,Function], required: true },
  label: { type: String, required: true },
  count: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false }
});
</script>

<template>
  <button :title="label"
    class="flex items-center gap-2 p-3 py-2 rounded-lg text-sm font-medium text-gray-700 transition-colors shadow-sm"
    :class="isActive 
      ? 'bg-slate-300 hover:bg-slate-300 ' 
      : 'text-card-foreground  hover:bg-slatey-300 '"
  >
    <component :is="icon" class="h-5 w-7 " />
    <span 
      class="px-1.5 py-.5 rounded-md  font-semibold">
      {{ count }}
    </span>
  </button>
</template>