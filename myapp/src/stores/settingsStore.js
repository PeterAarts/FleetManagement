// ============================================
// FILE: src/stores/settingsStore.js (FIXED - BACKWARD COMPATIBLE)
// ============================================
import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';
import { useVehiclesStore } from './vehiclesStore';
import { useDashboardStore } from './dashboardStore';
import { useAuthStore } from './authStore';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // Keep original naming - settings (not domainSettings)
    settings: null,
    
    // Customer context
    customerGroups: [],
    selectedGroup: null,
    
    isLoading: false,
    paginationLimit: 10,
  }),
  
  getters: {
    // All existing getters work as before
    siteName: (state) => state.settings?.site_name || 'Fleet Management',
    siteDescription: (state) => state.settings?.site_description || '',
    siteDomain: (state) => state.settings?.domain || '',
    cssStyle: (state) => state.settings?.style_css || 'blue.css',
    cssMenu: (state) => state.settings?.style_menu || 'fullscreen_menu.css',
    refreshRate: (state) => state.settings?.refresh_rate || 2,
    dashboardRefreshRate: (state) => state.settings?.dashboard_refresh_rate || 15,
    vehiclesRefreshRate: (state) => state.settings?.vehicles_refresh_rate || 1,
    dashboardStatistics: (state) => state.settings?.daysStatistics || 14,
  },
  
  actions: {
    /**
     * Fetch settings - called ONCE after login
     * Gets both domain settings and customer context
     */
    async fetchSettings() {
      this.isLoading = true;
      try {
        const domainResponse = await apiClient.get('/settings/domain');
        this.settings = domainResponse.data.settings;
        console.log('✓ Domain settings loaded.');
        
        const contextResponse = await apiClient.get('/settings/customer-context');
        this.customerGroups = contextResponse.data.groups || [];

        // =================================================================
        // START: FIX FOR DATA TYPE MISMATCH
        // =================================================================
        // Ensure the ID from the API is parsed into a number.
        const selectedId = contextResponse.data.selectedCustomerId;
        this.selectedGroup = selectedId ? parseInt(selectedId, 10) : null;
        // =================================================================
        // END: FIX FOR DATA TYPE MISMATCH
        // =================================================================
        
        const authStore = useAuthStore();
        if (this.selectedGroup) {
          authStore.selectedCustomerId = this.selectedGroup;
        }
        
        console.log('✓ Customer context loaded:', { selectedGroup: this.selectedGroup });
        
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Refresh customer context only
     * Used by auto-refresh to check for new customer grants
     */
    async refreshCustomerContext() {
      try {
        const response = await apiClient.get('/settings/customer-context');
        
        const newGroups = response.data.groups || [];
        const hadAccessBefore = this.customerGroups.length;
        const hasAccessNow = newGroups.length;
        
        this.customerGroups = newGroups;
        
        // Log if access changed
        if (hasAccessNow > hadAccessBefore) {
          console.log('✓ New customer access granted:', hasAccessNow - hadAccessBefore, 'new customers');
        } else if (hasAccessNow < hadAccessBefore) {
          console.warn('⚠ Customer access revoked:', hadAccessBefore - hasAccessNow, 'customers removed');
        }
        
      } catch (error) {
        console.error('Failed to refresh customer context:', error);
      }
    },
    
    /**
     * Switch between customers
     * Does NOT reload settings - only reloads customer data
     */
    async setSelectedGroup(groupId) {
      // Ensure the incoming groupId is also treated as a number
      const numericGroupId = parseInt(groupId, 10);

      if (this.selectedGroup === numericGroupId) {
        return;
      }
      
      const authStore = useAuthStore();
      
      try {
        await authStore.switchCustomer(numericGroupId);
        this.selectedGroup = numericGroupId;
        
        const vehiclesStore = useVehiclesStore();
        const dashboardStore = useDashboardStore();
        
        // Reset stores and fetch new data
        vehiclesStore.resetForNewGroup();
        dashboardStore.resetForNewGroup();
        
        await Promise.all([
          vehiclesStore.fetchVehicles(),
          dashboardStore.fetchDashboardData()
        ]);
        
        console.log(`✓ Switched to customer: ${numericGroupId}`);
        
      } catch (error) {
        console.error(`✗ Failed to switch to customer ${numericGroupId}:`, error);
        // Revert on error
        this.selectedGroup = authStore.effectiveCustomerId;
        throw error;
      }
    },
    
    setCustomerGroups(groups) {
      this.customerGroups = groups || [];
    },
    
    clearSettings() {
      this.settings = null;
      this.customerGroups = [];
      this.selectedGroup = null;
    }
  },
});