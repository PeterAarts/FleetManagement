// ============================================
// FILE: src/stores/authStore.js (FIXED IMPORTS)
// ============================================
import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('authToken') || null,
    selectedCustomerId: null,
    tokenCheckInterval: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !state.isTokenExpired,
    userName: (state) => state.user?.username || 'User',
    customerId: (state) => state.user?.customerId,
    effectiveCustomerId: (state) => state.selectedCustomerId || state.user?.customerId,
    isTokenExpired: (state) => {
      if (!state.user?.exp) return false;
      const expirationTime = state.user.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = 60 * 1000;
      return currentTime >= (expirationTime - bufferTime);
    },
    tokenExpiresInMinutes: (state) => {
      if (!state.user?.exp) return null;
      const expirationTime = state.user.exp * 1000;
      const currentTime = Date.now();
      const remainingTime = expirationTime - currentTime;
      return remainingTime > 0 ? Math.floor(remainingTime / (60 * 1000)) : 0;
    }
  },

  actions: {
    resetAllApplicationState() {
      // Import stores dynamically to avoid circular dependencies
      import('./vehiclesStore').then(({ useVehiclesStore }) => useVehiclesStore().$reset());
      import('./dashboardStore').then(({ useDashboardStore }) => useDashboardStore().$reset());
      import('./settingsStore').then(({ useSettingsStore }) => useSettingsStore().$reset());
      import('./tripsStore').then(({ useTripsStore }) => useTripsStore().$reset());
      import('./geofenceStore').then(({ useGeofenceStore }) => useGeofenceStore().reset());
      
      this.clearAuthData();
      console.log('✓ All application state reset');
    },

    async login(credentials) {
      try {
        const response = await apiClient.post('/auth/login', credentials, {
          skipAuth: true
        });

        this.token = response.data.token;
        localStorage.setItem('authToken', this.token);

        if (response.data.user) {
          this.user = response.data.user;
          this.selectedCustomerId = response.data.user.selectedCustomerId || response.data.user.customerId;
        } else {
          this.user = this.decodeToken(this.token);
          this.selectedCustomerId = this.user.customerId;
        }

        this.startTokenExpirationCheck();

        const { default: activityMonitor } = await import('@/tools/activityMonitor');
        activityMonitor.init(this.user);

        console.log('✓ Login successful:', this.user.username);
        return response.data;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    async logout(reason = 'manual') {
      try {
        const { default: activityMonitor } = await import('@/tools/activityMonitor');
        activityMonitor.cleanup();
      } catch (error) {
        console.error('Activity monitor cleanup error:', error);
      }

      try {
        if (reason === 'manual') {
          await apiClient.post('/auth/logout');
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.resetAllApplicationState();
        router.push({
          name: 'auth',
          query: reason === 'expired' ? { reason: 'session-expired' } : {}
        });
      }
    },

    clearAuthData() {
      this.user = null;
      this.token = null;
      this.selectedCustomerId = null;
      localStorage.removeItem('authToken');
      this.stopTokenExpirationCheck();
    },

    startTokenExpirationCheck() {
      this.stopTokenExpirationCheck();
      this.tokenCheckInterval = setInterval(() => {
        if (this.isTokenExpired) {
          console.warn('Token expired, logging out...');
          this.logout('expired');
        }
      }, 60000);
    },

    stopTokenExpirationCheck() {
      if (this.tokenCheckInterval) {
        clearInterval(this.tokenCheckInterval);
        this.tokenCheckInterval = null;
      }
    },

    async fetchSessionInfo() {
      try {
        const response = await apiClient.get('/session/info');
        this.selectedCustomerId = response.data.selectedCustomerId;
        return response.data;
      } catch (error) {
        console.error('Failed to fetch session info:', error);
        if (error.response?.status === 401) {
          this.logout('expired');
        }
      }
    },

    async switchCustomer(customerId) {
      try {
        const response = await apiClient.put('/session/customer', { customerId });
        this.selectedCustomerId = response.data.selectedCustomerId;
        return response.data;
      } catch (error) {
        console.error('Failed to switch customer:', error);
        throw error;
      }
    },

    tryAutoLogin() {
      if (this.token && !this.user) {
        this.user = this.decodeToken(this.token);

        if (this.isTokenExpired) {
          console.warn('Stored token expired, clearing');
          this.clearAuthData();
          return;
        }

        this.startTokenExpirationCheck();
        import('@/tools/activityMonitor').then(({ default: activityMonitor }) => {
          activityMonitor.init(this.user);
        });
        this.fetchSessionInfo();
      }
    },

    decodeToken(token) {
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.error("Failed to decode token", error);
        this.logout('invalid');
        return null;
      }
    },
  },
});