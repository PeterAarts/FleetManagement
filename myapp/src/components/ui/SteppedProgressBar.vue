<!-- SteppedProgressBar.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  percent:          {type: Number,default: 0},
  barsCount:        {type: Number,default: 4},
  color:            {type: String,default: 'primary-500' },
  backgroundColor:  {type: String,default: '#e5e7eb' }
});

const percentPerBar = computed(() => 100 / props.barsCount);

const getBarFillPercentage = (barIndex) => {
  const diff = ((props.percent - percentPerBar.value * barIndex) / percentPerBar.value) * 100;
  return Math.max(0, Math.min(100, diff));
};
</script>

<template>
  <div class="stepped-progress-container">
    <div 
      v-for="(_, index) in Array(barsCount)" 
      :key="index"
      class="stepped-bar"
      :style="{
        background: `linear-gradient(to right, ${color} ${getBarFillPercentage(index)}%, ${backgroundColor} ${getBarFillPercentage(index)}%)`
      }"
    ></div>
  </div>
</template>

<style scoped>
.stepped-progress-container {display: flex;gap: 3px;width: 76px; height: 6px; }
.stepped-bar                {flex: 1;height: 100%;border-radius: 4px;}
</style>