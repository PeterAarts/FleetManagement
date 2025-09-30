// ============================================
// FILE: src/stores/authStore.js (COMPLETE AND FIXED)
// ============================================
import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';
import { resetAllStores } from '@/tools/pinia';
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
      const bufferTime = 60 * 1000; // 1 minute buffer
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
    async login(credentials) {
      try {
        // Use the custom 'skipAuth' flag to prevent the interceptor
        // from sending an expired token with the login request.
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
        // Only call server logout for manual logouts, not for expired tokens
        if (reason === 'manual') {
          await apiClient.post('/auth/logout');
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuthData();

        // Create a query object to pass to the router
        const query = {};
        if (reason === 'expired') {
          query.reason = 'session-expired';
        } else if (reason === 'invalid') {
          query.reason = 'invalid-token';
        }
        
        resetAllStores();
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
      // Clear any existing interval
      this.stopTokenExpirationCheck();

      // Check token expiration every minute
      this.tokenCheckInterval = setInterval(() => {
        if (this.isTokenExpired) {
          console.warn('Token has expired, logging out...');
          this.logout('expired');
        } else {
          // Optional: Log remaining time for debugging
          const remainingMinutes = this.tokenExpiresInMinutes;
          if (remainingMinutes <= 5 && remainingMinutes > 0) {
            console.warn(`Token expires in ${remainingMinutes} minutes`);
          }
        }
      }, 60000); // Check every minute
    },

    stopTokenExpirationCheck() {
      if (this.tokenCheckInterval) {
        clearInterval(this.tokenCheckInterval);
        this.tokenCheckInterval = null;
      }
    },

    checkTokenExpiration() {
      if (this.isTokenExpired) {
        this.logout('expired');
        return false;
      }
      return true;
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

        if (response.data.user) {
          this.user = { ...this.user, ...response.data.user };
          const { default: activityMonitor } = await import('@/tools/activityMonitor');
          activityMonitor.init(this.user); // Reinitialize with updated user data
        }

        return response.data;
      } catch (error) {
        console.error('Failed to switch customer:', error);
        throw error;
      }
    },

    tryAutoLogin() {
      if (this.token && !this.user) {
        this.user = this.decodeToken(this.token);

        // Check if token is expired before proceeding
        if (this.isTokenExpired) {
          console.warn('Stored token is expired, clearing auth data');
          this.clearAuthData();
          return;
        }

        // Start token monitoring for auto-login
        this.startTokenExpirationCheck();

        import('@/tools/activityMonitor').then(({ default: activityMonitor }) => {
          activityMonitor.init(this.user);
        });

        // Fetch session info on auto-login
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