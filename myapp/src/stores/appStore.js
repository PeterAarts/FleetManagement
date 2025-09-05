import { defineStore } from 'pinia';
// ✅ 1. Re-add the import for the authStore
import { useAuthStore } from './authStore';
import { useVehiclesStore } from './vehiclesStore';
import { useDashboardStore } from './dashboardStore';
import { useSettingsStore } from './settingsStore';

export const useAppStore = defineStore('app', {
  state: () => ({
    isServerDown: false,
  }),
  actions: {
    handleServerDown() {
      if (this.isServerDown) return;
      this.isServerDown = true;
      
      console.error("Server connection lost. Resetting application state.");
      
      const authStore = useAuthStore();
      const vehiclesStore = useVehiclesStore();
      const dashboardStore = useDashboardStore();
      const settingsStore = useSettingsStore();

      // ✅ 2. Call the new 'softLogout' to clear the user's session without redirecting
      authStore.softLogout();
      
      // Reset all other data stores
      vehiclesStore.resetForNewGroup();
      dashboardStore.resetForNewGroup();
      settingsStore.clearSettings();
    },
        resetServerDownState() {
      if (this.isServerDown) {
        console.log("Server connection restored. Resetting UI state.");
        this.isServerDown = false;
      }
    },
  },
});