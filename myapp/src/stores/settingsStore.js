import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';
import { useVehiclesStore } from './vehiclesStore';
import { useDashboardStore } from './dashboardStore';
// ✅ UPDATED: Import nextTick from Vue
import { nextTick } from 'vue';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: null,
    isLoading: true,
    paginationLimit: 8,
    customerGroups: [],
    selectedGroup: localStorage.getItem('selectedGroup') ? parseInt(localStorage.getItem('selectedGroup'), 10) : null,
  }),
  getters: {
    siteName: (state) => state.settings?.site_name || 'Fleet Management',
    refreshRate: (state) => state.settings?.refresh_rate || 2,
    dashboardRefreshRate: (state) => state.settings?.dashboard_refresh_rate || 15,
    vehiclesRefreshRate: (state) => state.settings?.vehicles_refresh_rate || 1,
  },
  actions: {
    async fetchSettings() {
      this.isLoading = true;
      try {
        const response = await apiClient.get('/settings');
        this.settings = response.data.settings; 
        this.customerGroups = response.data.groups || [];
           
        // Determine the correct group ID that should be selected.
        let targetGroupId = this.selectedGroup; // Get the value from localStorage
        const groupExists = this.customerGroups.some(group => group.id == targetGroupId);

        if (!targetGroupId || !groupExists) {
          targetGroupId = this.settings?.customer_id; // Default to the user's main group
        }

        // "Nudge" the reactivity system by clearing the selection first.
        this.selectedGroup = null;
        await nextTick(); // Wait for Vue to process this change.
        
        // Set the final, correct value.
        this.selectedGroup = targetGroupId;

        // Ensure localStorage is in sync with the final value.
        localStorage.setItem('selectedGroup', this.selectedGroup);
        
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async setSelectedGroup(groupId) {
      if (this.selectedGroup == groupId) return;
      
      this.selectedGroup = groupId;
      localStorage.setItem('selectedGroup', groupId);
      
      const vehiclesStore = useVehiclesStore();
      const dashboardStore = useDashboardStore();
      
      vehiclesStore.resetForNewGroup();
      dashboardStore.resetForNewGroup();
      
      await Promise.all([
        vehiclesStore.fetchVehicles(),
        dashboardStore.fetchDashboardData()
      ]);
    },
    clearSettings() {
        this.settings = null;
        this.customerGroups = [];
        this.selectedGroup = null;
        localStorage.removeItem('selectedGroup');
    }
  },
});