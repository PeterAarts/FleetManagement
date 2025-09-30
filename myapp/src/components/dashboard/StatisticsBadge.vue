<script setup>
import { computed } from 'vue';
import { ArrowUp, ArrowDown } from 'lucide-vue-next';

const props = defineProps({
  icon: { type: [Object, Function], required: true },
  label: { type: String, required: true },
  value: { type: [String, Number], default: '0' },
  trend: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  isActive: { type: Boolean, default: false },
  trendDirection: { type: String, default: 'normal' }, // 'normal' or 'inverse'
});

// A helper to determine if we should show the trend arrow at all
const hasTrend = computed(() => props.trend != null && props.trend !== 0);

const trendColorClass = computed(() => {
  if (!hasTrend.value) return 'text-gray-500';

  const isPositive = props.trend > 0;
  if (props.trendDirection === 'inverse') {
    return isPositive ? 'text-red-600' : 'text-green-600';
  }
  return isPositive ? 'text-green-600' : 'text-red-600';
});

const formattedTrend = computed(() => {
  if (!hasTrend.value) return null;
  return `${Math.abs(props.trend).toFixed(2)}%`;
});
</script>

<template>
  <div
    class="group p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 bg-slate-100"
    :class="isActive ? 'hover:bg-slate-300 border border ' : ' hover:bg-slate-300'"
  >
    <div class="flex-shrink-0 bg-slate-100 p-2 rounded-md">
      <component :is="props.icon" class="h-5 w-5 text-slate-700" />
    </div>

    <div class="flex-grow flex flex-col items-end">
      <span class="text-xs text-slate-500 capitalize -mb-1">{{ props.label }}</span>
      <div class="flex items-center gap-2">
        <div v-if="hasTrend" :class="trendColorClass" class="flex items-center gap-1">
          <ArrowDown v-if="props.trend < 0" class="h-4 w-4" />
          <ArrowUp v-if="props.trend > 0" class="h-4 w-4" />
          <div class="max-w-0 group-hover:max-w-xs transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
            <span class="text-sm font-semibold">{{ formattedTrend }}</span>
          </div>
        </div>
        <span class="text-xl font-bold text-slate-800">{{ props.value }}</span>
        <span v-if="props.unit" class="text-sm text-slate-600 -ml-1">{{ props.unit }}</span>
      </div>
    </div>
  </div>
</template>