<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useAutoRefresh } from '@/composables/useAutoRefresh';


const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const vehiclesStore = useVehiclesStore();

onMounted(async () => {
  // Try auto-login from stored token
  await authStore.tryAutoLogin();
  
  // If authenticated, load settings and data
  if (authStore.isAuthenticated) {
    try {
      // Fetch settings once (domain settings + customer context)
      await settingsStore.fetchSettings();
      
      // Fetch initial vehicles
      await vehiclesStore.fetchVehicles();
      
    } catch (error) {
      console.error('Failed to load application data:', error);
      // On any error, logout and let user re-authenticate
      await authStore.logout('manual');
    }
  }
});

// Optional: Auto-refresh customer context to detect new grants
// This checks if the user has been granted access to additional customers
useAutoRefresh(async () => {
  if (authStore.isAuthenticated) {
    await settingsStore.refreshCustomerContext();
  }
}, 15); 

</script>

<template>
  <router-view />
</template>