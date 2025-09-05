<script setup>
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const props = defineProps({
  icon: {
    type: Object,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  tooltip: {
    type: String,
    required: true
  }
});
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <Tooltip>
      <TooltipTrigger as-child>
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100  rounded-lg text-slate-900 font-medium cursor-default">
          <component :is="props.icon" class="h-5 w-5 text-slate-500" />
          <span>{{ props.value }}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ props.tooltip }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>