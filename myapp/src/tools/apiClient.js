// ============================================
// FILE: apiClient.js (UPDATED)
// ============================================
import axios from 'axios';
import router from '@/router';

const apiClient = axios.create({
  // Note: Your error logs show port 3002, but this defaults to 3001.
  // Make sure your .env file has VITE_API_BASE_URL=http://localhost:3002/api
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isLoggingOut = false;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // +++ ADD THIS CHECK +++
    // If a request is configured to skip auth, return it immediately.
    if (config.skipAuth) {
      return config;
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ... The response interceptor remains unchanged ...
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401) {
      console.log('Authentication error detected:', error.response.data?.message);
      
      if (!isLoggingOut && !originalRequest._retry) {
        isLoggingOut = true;
        originalRequest._retry = true;
        
        try {
          localStorage.removeItem('authToken');
          const { useAuthStore } = await import('@/stores/authStore');
          const { useSettingsStore } = await import('@/stores/settingsStore');
          const { resetAllStores } = await import('@/tools/pinia');
          
          const authStore = useAuthStore();
          const settingsStore = useSettingsStore();
          
          authStore.user = null;
          authStore.token = null;
          authStore.selectedCustomerId = null;
          settingsStore.clearSettings();
          resetAllStores();
          
          const message = error.response.data?.message;
          if (message && (message.includes('expired') || message.includes('invalid'))) {
            console.warn('Session expired. Please log in again.');
          }
          
          if (router.currentRoute.value.name !== 'auth') {
            router.push({ 
              name: 'auth',
              query: { 
                redirect: router.currentRoute.value.fullPath,
                reason: 'session-expired'
              }
            });
          }
          
        } catch (storeError) {
          console.error('Error during automatic logout:', storeError);
        } finally {
          isLoggingOut = false;
        }
      }
      
      return Promise.reject(error);
    }
    
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data?.message);
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data?.message);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error - server may be unreachable');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;