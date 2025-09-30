<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
// +++ IMPORT the other necessary stores +++
import { useSettingsStore } from '@/stores/settingsStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useAutoRefresh } from '@/composables/useAutoRefresh'

const authStore = useAuthStore();
// +++ INSTANTIATE the other stores +++
const settingsStore = useSettingsStore();
const vehiclesStore = useVehiclesStore();

onMounted(async () => {
  // Try auto-login from a stored token
  await authStore.tryAutoLogin();
  
  // If the user is successfully authenticated...
  if (authStore.isAuthenticated) {
    // ...sync their settings and session info with the server first.
    await settingsStore.fetchSettings();
    // ...then fetch the initial list of vehicles.
    await vehiclesStore.fetchVehicles();
  }
});
// The global settings auto-refresh
// The interval should be in minutes (15) 
useAutoRefresh(settingsStore.fetchSettings, 15); 

</script>

<template>
  <router-view />
</template>