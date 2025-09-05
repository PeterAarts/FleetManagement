<script setup>
import { useDashboardStore } from '@/stores/dashboardStore';

const dashboardStore = useDashboardStore();
const kpis = dashboardStore.kpis;
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Fleet Usage Statistics</h2>
    
    <div class="grid grid-cols-2 gap-4">
      <Card>
        <template #title>
          <div class="text-sm font-medium text-gray-500">Trips</div>
        </template>
        <template #content>
          <p class="text-2xl font-bold">{{ kpis.totalTrips }}</p>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="text-sm font-medium text-gray-500">Distance (km)</div>
        </template>
        <template #content>
          <p class="text-2xl font-bold">{{ Math.round(kpis.totalDistance) }}</p>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="text-sm font-medium text-gray-500">Fuel Used (L)</div>
        </template>
        <template #content>
          <p class="text-2xl font-bold">{{ Math.round(kpis.totalFuel) }}</p>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="text-sm font-medium text-gray-500">Vehicles Active</div>
        </template>
        <template #content>
          <p class="text-2xl font-bold">{{ kpis.totalVehicles }}</p>
        </template>
      </Card>
    </div>

    <div class="mt-8">
      <h3 class="font-bold mb-2">Daily Distance</h3>
      </div>
    <div class="mt-8">
      <h3 class="font-bold mb-2">Fleet Status</h3>
      </div>
  </div>
</template>