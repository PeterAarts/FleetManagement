import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('authToken') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userName: (state) => state.user?.username || 'User',
    // We can get the customerId from the user object
    customerId: (state) => state.user?.customerId,
  },
  actions: {
    async login(credentials) {
      const response = await apiClient.post('/auth/login', credentials);
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      this.user = this.decodeToken(this.token);
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('authToken');
    },
    tryAutoLogin() {
      if (this.token && !this.user) {
        this.user = this.decodeToken(this.token);
      }
    },
    decodeToken(token) {
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.error("Failed to decode token", error);
        this.logout();
        return null;
      }
    },
  },
});