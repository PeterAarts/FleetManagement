<script setup>
defineProps({
  icon: { type: Object, required: true },
  label: { type: String, required: true },
  count: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false }
});
</script>

<template>
  <button 
    class="flex items-center gap-2 p-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
    :class="isActive 
      ? 'bg-primary text-white' 
      : 'bg-card/80 text-card-foreground  hover:bg-primary/80 hover:text-white'"
  >
    <component :is="icon" class="h-5 w-7 text-slate-500" />
    <!-- The label can be hidden on smaller screens if desired 
    <span class="hidden sm:inline">{{ label }}</span>-->
    <span 
      class="px-1.5 py-.5 rounded-md text-xl font-semibold">
      {{ count }}
    </span>
  </button>
</template>