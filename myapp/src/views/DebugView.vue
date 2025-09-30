<script setup>
import { watch } from 'vue';
import { useTripsStore } from '@/stores/tripsStore';
import { storeToRefs } from 'pinia';

const tripsStore = useTripsStore();
const {activeTrip}  = storeToRefs(tripsStore);

watch(activeTrip, (newValue) => {
  console.log('%cDebugView: The activeTrip state has changed!', 'color: green; font-weight: bold;');
}, { deep: true, immediate: true });
</script>

<template>
  <div style="padding: 40px; font-family: sans-serif;">
    <h1>Trip Debugging Page</h1>
    <div v-if="activeTrip" style="background-color: #e0ffe0; padding: 20px;">
      <h2 style="color: green; font-weight: bold;">SUCCESS: A trip is active!</h2>
      <pre>{{ activeTrip }}</pre>
    </div>
    <div v-else style="background-color: #ffeeee; padding: 20px;">
      <h2 style="color: red; font-weight: bold;">WAITING: No active trip.</h2>
    </div>
  </div>
</template>