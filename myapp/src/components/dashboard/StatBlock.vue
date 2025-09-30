<script setup>
import { ArrowDown, ArrowUp } from 'lucide-vue-next';
defineProps({
  label: String,
  value: Number,
  unit: String,
  change: Number,
});
</script>
<template>
  <div class="space-y-1 rounded-lg bg-gray-100 p-3">
    <p class="text-xs font-medium uppercase text-muted-foreground">{{ label }}</p>
    <div class="flex items-baseline justify-center gap-2">
      <p class="text-2xl font-bold">{{ value?.toFixed(1) }}</p>
      <p v-if="unit" class="text-xs text-muted-foreground">{{ unit }}</p>
    </div>
    <div v-if="change" class="flex items-center justify-center text-xs" :class="change > 0 ? 'text-green-500' : 'text-red-500'">
      <ArrowUp v-if="change > 0" class="h-3 w-3" />
      <ArrowDown v-else class="h-3 w-3" />
      <span>{{ Math.abs(change).toFixed(2) }}%</span>
    </div>
  </div>
</template>