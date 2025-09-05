<script setup>
// Mock data
const vehicleStatusCounts = { driving: 0, working: 1, stopped: 21, repair: 0 };
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-lg shadow-md">
    <div class="absolute top-4 left-4 z-10 flex gap-3 rounded-lg bg-white/70 p-2 shadow-lg backdrop-blur-sm">
      <div class="rounded p-2 text-center">
        <p class="text-lg font-bold">{{ vehicleStatusCounts.driving }}</p>
        <p class="text-xs font-semibold text-gray-600">DRIVING</p>
      </div>
      <div class="rounded p-2 text-center">
        <p class="text-lg font-bold">{{ vehicleStatusCounts.working }}</p>
        <p class="text-xs font-semibold text-gray-600">WORKING</p>
      </div>
      <div class="rounded p-2 text-center">
        <p class="text-lg font-bold">{{ vehicleStatusCounts.stopped }}</p>
        <p class="text-xs font-semibold text-gray-600">STOPPED</p>
      </div>
       <div class="rounded bg-yellow-400 p-2 text-center text-black">
        <p class="text-lg font-bold">{{ vehicleStatusCounts.repair }}</p>
        <p class="text-xs font-semibold">REPAIR</p>
      </div>
    </div>

    <div class="h-full w-full rounded-lg bg-gray-300 flex items-center justify-center">
      MAP AREA
    </div>
  </div>
</template>