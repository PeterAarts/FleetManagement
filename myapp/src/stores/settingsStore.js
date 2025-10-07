// ============================================
// FILE: src/stores/settingsStore.js (UPDATE EXISTING)
// ============================================
import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';
import { useVehiclesStore } from './vehiclesStore';
import { useDashboardStore } from './dashboardStore';
import { useAuthStore } from './authStore';
import { nextTick } from 'vue';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: null,
    isLoading: true,
    paginationLimit: 10,
    customerGroups: [],
    selectedGroup: null, // Remove localStorage dependency
  }),
  
  getters: {
    siteName: (state) => state.settings?.site_name || 'Fleet Management',
    refreshRate: (state) => state.settings?.refresh_rate || 2,
    dashboardRefreshRate: (state) => state.settings?.dashboard_refresh_rate || 15,
    vehiclesRefreshRate: (state) => state.settings?.vehicles_refresh_rate || 1,
    dashboardStatistics: (state) => state.settings?.daysStatistics || 14,
  },
  
  actions: {
    async fetchSettings() {
      this.isLoading = true;
      try {
        const oldSelectedGroup = this.selectedGroup;
        const response = await apiClient.get('/settings');
        this.settings = response.data.settings;
        this.customerGroups = response.data.groups || [];
        
        // Get selectedCustomerId from server response
        const selectedCustomerId = response.data.selectedCustomerId;
        const selectedGroupStillExists = this.customerGroups.some(g => g.id === oldSelectedGroup);

        if (!selectedGroupStillExists) {
          // If not, reset to the user's primary group to avoid errors
          this.selectedGroup = response.data.selectedCustomerId;
          console.warn('Previously selected group no longer exists. Resetting to primary group.');
        }
        //  Update auth store with server session data
        const authStore = useAuthStore();
        if (selectedCustomerId) {
          authStore.selectedCustomerId = selectedCustomerId;
        }
        
        // Set selectedGroup from server session
        this.selectedGroup = selectedCustomerId || this.settings?.customer_id;
        
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async setCustomerGroups(groups) {
      this.customerGroups = groups || [];
    },
    async setSelectedGroup(groupId) {
      if (this.selectedGroup === groupId) return;
      
      const authStore = useAuthStore();
      
      try {
        // >>> CHANGE: Update server session
        await authStore.switchCustomer(groupId);
        
        this.selectedGroup = groupId;
        
        // Reset and refetch data for the new customer
        const vehiclesStore = useVehiclesStore();
        const dashboardStore = useDashboardStore();
        
        vehiclesStore.resetForNewGroup();
        dashboardStore.resetForNewGroup();
        
        await Promise.all([
          vehiclesStore.fetchVehicles(),
         //dashboardStore.fetchDashboardData()
        ]);
      } catch (error) {
        console.error('Failed to switch customer:', error);
        // Revert on error
        this.selectedGroup = authStore.effectiveCustomerId;
        throw error; // Re-throw for the component to handle
      }
    },
    
    // NEW: Handle customer switch from auth store
    async handleCustomerSwitch(customerId) {
      this.selectedGroup = customerId;
      
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
    }
  },
});