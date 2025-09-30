<!-- TokenDebug.vue -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import apiClient from '@/tools/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

const tokenInfo = ref(null);
const activityInfo = ref(null);
const isLoading = ref(false);
const error = ref(null);
const autoRefresh = ref(true);
let refreshInterval = null;

// Access stores
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

// Reactive store information
const storeInfo = computed(() => ({
  auth: {
    isAuthenticated: authStore.isAuthenticated,
    token: authStore.token ? `${authStore.token.substring(0, 20)}...` : null,
    user: authStore.user,
    selectedCustomerId: authStore.selectedCustomerId,
    availableCustomers: authStore.availableCustomers
  },
  settings: {
    selectedCustomer: settingsStore.selectedCustomer,
    selectedGroup: settingsStore.selectedGroup,
    settings: settingsStore.settings,
    customers: settingsStore.customers,
    groups: settingsStore.groups,
    isLoading: settingsStore.isLoading
  }
}));

// Client-side token analysis
const clientTokenInfo = computed(() => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  if (!token) {
    return { hasToken: false, error: 'No token in storage' };
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    
    return {
      hasToken: true,
      isExpired: timeUntilExpiry <= 0,
      payload,
      timeUntilExpiry,
      expiresAt: new Date(payload.exp * 1000),
      issuedAt: new Date(payload.iat * 1000)
    };
  } catch (e) {
    return { hasToken: true, error: 'Invalid token format', details: e.message };
  }
});

const fetchTokenInfo = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.get('/debug/token-info');
    tokenInfo.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
    console.error('Token debug error:', err);
  } finally {
    isLoading.value = false;
  }
};

const fetchActivityInfo = async () => {
  try {
    const response = await apiClient.get('/auth/activity-status');
    activityInfo.value = response.data;
  } catch (err) {
    console.error('Activity info error:', err);
    activityInfo.value = { error: err.response?.data?.message || err.message };
  }
};

const fetchAllInfo = async () => {
  await Promise.all([
    fetchTokenInfo(),
    fetchActivityInfo()
  ]);
};

const createTestToken = async () => {
  try {
    const response = await apiClient.get('/debug/test-expired-token');
    console.log('Test token created:', response.data);
    alert(`Test token created! Check console for details. It expires in 5 seconds.`);
  } catch (err) {
    console.error('Error creating test token:', err);
  }
};

const testCustomerSwitch = async () => {
  if (storeInfo.value.auth.availableCustomers?.length > 1) {
    const currentId = storeInfo.value.auth.selectedCustomerId;
    const otherCustomer = storeInfo.value.auth.availableCustomers.find(c => c.id !== currentId);
    
    if (otherCustomer) {
      try {
        await authStore.switchCustomer(otherCustomer.id);
        console.log(`Switched to customer ${otherCustomer.id}`);
      } catch (error) {
        console.error('Error switching customer:', error);
      }
    }
  } else {
    alert('No other customers available to switch to');
  }
};

const simulateActivity = async () => {
  try {
    await apiClient.post('/auth/activity-ping', { timestamp: Date.now() });
    console.log('Activity ping sent');
    // Refresh activity info immediately
    await fetchActivityInfo();
  } catch (error) {
    console.error('Error sending activity ping:', error);
  }
};

const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(fetchAllInfo, 5000); // Refresh every 5 seconds
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const formatDuration = (milliseconds) => {
  if (milliseconds <= 0) return 'Expired';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const getActivityStatusColor = (timeUntilTimeout) => {
  if (timeUntilTimeout <= 0) return 'text-red-600 bg-red-50';
  if (timeUntilTimeout <= 5 * 60 * 1000) return 'text-orange-600 bg-orange-50'; // 5 minutes
  return 'text-green-600 bg-green-50';
};

onMounted(() => {
  fetchAllInfo();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="mx-auto p-6 space-y-6">
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Token & Activity Debug</h1>
        <div class="flex gap-2">
          <button 
            @click="toggleAutoRefresh"
            :class="autoRefresh ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'"
            class="px-3 py-1 text-white  rounded"
          >
            {{ autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF' }}
          </button>
          <button 
            @click="fetchAllInfo" 
            :disabled="isLoading"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
          >
            <i v-if="isLoading" class="fa fa-spinner fa-spin mr-2"></i>
            Refresh
          </button>
          <button 
            @click="createTestToken"
            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
          >
            Test Token
          </button>
          <button 
            @click="testCustomerSwitch"
            class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded"
          >
            Switch Customer
          </button>
          <button 
            @click="simulateActivity"
            class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded"
          >
            Simulate Activity
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !tokenInfo" class="text-center py-8">
        <i class="fa fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
        <p>Loading debug information...</p>
      </div>

      <!-- Main Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        <!-- Server-side Analysis -->
        <div class="bg-slate-100 rounded-xl border p-4 ">
          <h3 class="font-bold text-lg mb-4 flex items-center uppercase  border-b border-slate-300 pb-2">
            <i class="fa-light fa-server mr-2 text-primary-500"></i>
            Server-side Analysis
          </h3>
          
          <div v-if="tokenInfo" class="space-y-3">
            <div class="flex justify-between">
              <span class="font-medium">Token Present:</span>
              <span :class="tokenInfo.hasToken ? 'text-green-600' : 'text-red-600'">
                {{ tokenInfo.hasToken ? 'Yes' : 'No' }}
              </span>
            </div>
            
            <div v-if="tokenInfo.hasToken" class="space-y-3">
              <div class="flex justify-between">
                <span class="font-medium">Valid Signature:</span>
                <span :class="tokenInfo.isValid ? 'text-green-600' : 'text-red-600'">
                  {{ tokenInfo.isValid ? 'Yes' : 'No' }}
                </span>
              </div>
              
              <div class="flex justify-between">
                <span class="font-medium">Is Expired:</span>
                <span :class="tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'">
                  {{ tokenInfo.isExpired ? 'Yes' : 'No' }}
                </span>
              </div>

              <div v-if="tokenInfo.verificationError" class=" text-red-600 bg-red-50 p-2 rounded">
                <strong>Verification Error:</strong> {{ tokenInfo.verificationError }}
              </div>

              <div v-if="tokenInfo.tokenInfo" class="space-y-2 border-t pt-3">
                <h4 class="font-medium">Token Details:</h4>
                <div class="space-y-1">
                  <div><strong>User ID:</strong> {{ tokenInfo.tokenInfo.userId }}</div>
                  <div><strong>Customer ID:</strong> {{ tokenInfo.tokenInfo.customerId }}</div>
                  <div><strong>Selected Customer:</strong> {{ tokenInfo.tokenInfo.selectedCustomerId }}</div>
                  <div><strong>Issued:</strong> {{ new Date(tokenInfo.tokenInfo.issuedAt).toLocaleString() }}</div>
                  <div><strong>Expires:</strong> {{ new Date(tokenInfo.tokenInfo.expiresAt).toLocaleString() }}</div>
                  <div class="font-medium" 
                       :class="tokenInfo.tokenInfo.timeUntilExpiry.seconds > 300 ? 'text-green-600' : 
                               tokenInfo.tokenInfo.timeUntilExpiry.seconds > 60 ? 'text-orange-600' : 'text-red-600'">
                    <strong>Time Until Expiry:</strong> {{ tokenInfo.tokenInfo.timeUntilExpiry.formatted }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Tracking Status -->
        <div class="bg-slate-100 rounded-xl border p-4 ">
          <h3 class="font-bold text-lg mb-4 flex items-center uppercase  border-b border-slate-300 pb-2">
            <i class="fa-light fa-clock mr-2 text-primary-600"></i>
            Activity Tracking
          </h3>
          
          <div v-if="activityInfo && !activityInfo.error" class="space-y-3">
            <div class="flex justify-between">
              <span class="font-medium">Is Dashboard User:</span>
              <span :class="activityInfo.isDashboardUser ? 'text-blue-600' : 'text-gray-600'">
                {{ activityInfo.isDashboardUser ? 'Yes' : 'No' }}
              </span>
            </div>
            
            <div class="space-y-2 border-t pt-3">
              <h4 class="font-medium">Activity Status:</h4>
              <div class=" space-y-1">
                <div><strong>Last Activity:</strong> {{ new Date(activityInfo.lastActivity).toLocaleString() }}</div>
                <div><strong>Time Since Activity:</strong> {{ formatDuration(activityInfo.timeSinceLastActivity) }}</div>
                <div class="font-medium px-2 py-1 rounded"
                     :class="getActivityStatusColor(activityInfo.timeUntilTimeout)">
                  <strong>Time Until Logout:</strong> {{ formatDuration(activityInfo.timeUntilTimeout) }}
                </div>
                <div><strong>Inactivity Limit:</strong> {{ formatDuration(activityInfo.inactivityLimit) }}</div>
              </div>
            </div>
            
            <!-- Activity Progress Bar -->
            <div class="border-t pt-3">
              <div class="flex justify-between  mb-1">
                <span>Activity Progress</span>
                <span>{{ Math.round((activityInfo.timeUntilTimeout / activityInfo.inactivityLimit) * 100) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500"
                     :class="activityInfo.timeUntilTimeout > activityInfo.inactivityLimit * 0.5 ? 'bg-green-500' : 
                             activityInfo.timeUntilTimeout > activityInfo.inactivityLimit * 0.1 ? 'bg-orange-500' : 'bg-red-500'"
                     :style="{ width: Math.max(0, (activityInfo.timeUntilTimeout / activityInfo.inactivityLimit) * 100) + '%' }">
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activityInfo?.error" class=" text-red-600 bg-red-50 p-2 rounded">
            <strong>Activity Error:</strong> {{ activityInfo.error }}
          </div>

          <div v-else class=" text-gray-500">
            Activity tracking not available
          </div>
        </div>

        <!-- Client-side Analysis -->
        <div class="bg-slate-100 rounded-xl border p-4 ">
          <h3 class="font-bold text-lg mb-4 flex items-center uppercase  border-b border-slate-300 pb-2">
            <i class="fa-light fa-desktop mr-2 text-primary-500"></i>
            Client-side Analysis
          </h3>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="font-medium">Token in Storage:</span>
              <span :class="clientTokenInfo.hasToken ? 'text-green-600' : 'text-red-600'">
                {{ clientTokenInfo.hasToken ? 'Yes' : 'No' }}
              </span>
            </div>
            
            <div v-if="clientTokenInfo.error" class=" text-red-600 bg-red-50 p-2 rounded">
              <strong>Client Error:</strong> {{ clientTokenInfo.error }}
              <div v-if="clientTokenInfo.details" class="mt-1 text-xs">{{ clientTokenInfo.details }}</div>
            </div>

            <div v-else-if="clientTokenInfo.hasToken" class="space-y-2">
              <div class="flex justify-between">
                <span class="font-medium">Is Expired (client):</span>
                <span :class="clientTokenInfo.isExpired ? 'text-red-600' : 'text-green-600'">
                  {{ clientTokenInfo.isExpired ? 'Yes' : 'No' }}
                </span>
              </div>
              
              <div class=" space-y-1 border-t pt-3">
                <h4 class="font-medium">Payload (client-decoded):</h4>
                <div><strong>User ID:</strong> {{ clientTokenInfo.payload?.userId }}</div>
                <div><strong>Customer ID:</strong> {{ clientTokenInfo.payload?.customerId }}</div>
                <div><strong>Issued:</strong> {{ clientTokenInfo.issuedAt?.toLocaleString() }}</div>
                <div><strong>Expires:</strong> {{ clientTokenInfo.expiresAt?.toLocaleString() }}</div>
                <div class="font-medium"
                     :class="clientTokenInfo.timeUntilExpiry > 300 ? 'text-green-600' : 
                             clientTokenInfo.timeUntilExpiry > 60 ? 'text-orange-600' : 'text-red-600'">
                  <strong>Seconds Until Expiry:</strong> {{ clientTokenInfo.timeUntilExpiry }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Auth Store Information -->
        <div class="bg-slate-100 rounded-xl border p-4 ">
          <h3 class="font-bold text-lg mb-4 flex items-center uppercase  border-b border-slate-300 pb-2">
            <i class="fa-light fa-pineapple mr-2 text-yellow-500"></i>
            Auth Store
          </h3>
          
          <div class="space-y-2 ">
            <div class="flex justify-between">
              <span class="font-medium">Is Authenticated:</span>
              <span :class="storeInfo.auth.isAuthenticated ? 'text-green-600' : 'text-red-600'">
                {{ storeInfo.auth.isAuthenticated ? 'Yes' : 'No' }}
              </span>
            </div>
            <div><strong>Token (preview):</strong> {{ storeInfo.auth.token || 'None' }}</div>
            <div><strong>Current User:</strong> {{ storeInfo.auth.user?.name || 'N/A' }}</div>
            <div><strong>Selected Customer ID:</strong> {{ storeInfo.auth.selectedCustomerId || 'N/A' }}</div>
            
            <div v-if="storeInfo.auth.availableCustomers?.length" class="border-t pt-2">
              <strong>Available Customers:</strong>
              <ul class="mt-1 space-y-1">
                <li v-for="customer in storeInfo.auth.availableCustomers" :key="customer.id"
                    class="text-xs px-2 py-1 rounded"
                    :class="customer.id === storeInfo.auth.selectedCustomerId ? 'bg-blue-200' : 'bg-gray-200'">
                  {{ customer.name }} (ID: {{ customer.id }})
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Settings Store Information -->
        <div class="bg-slate-100 rounded-xl border p-4 ">
          <h3 class="font-bold text-lg mb-4 flex items-center uppercase  border-b border-slate-300 pb-2">
            <i class="fa-light fa-pineapple mr-2 text-yellow-500"></i>
            Settings Store
          </h3>
          
          <div class="space-y-2 ">
            <div><strong>Selected Customer:</strong> {{ storeInfo.settings.selectedCustomer || 'N/A' }}</div>
            <div><strong>Selected Group:</strong> {{ storeInfo.settings.selectedGroup || 'N/A' }}</div>
            <div class="flex justify-between">
              <span class="font-medium">Is Loading:</span>
              <span :class="storeInfo.settings.isLoading ? 'text-orange-600' : 'text-green-600'">
                {{ storeInfo.settings.isLoading ? 'Yes' : 'No' }}
              </span>
            </div>
            
            <div v-if="storeInfo.settings.customers?.length" class="border-t pt-2">
              <strong>Customers in Settings:</strong>
              <ul class="mt-1 space-y-1">
                <li v-for="customer in storeInfo.settings.customers" :key="customer.id"
                    class="text-xs px-2 py-1 rounded bg-gray-200">
                  {{ customer.name }} (ID: {{ customer.id }})
                </li>
              </ul>
            </div>
            
            <div v-if="storeInfo.settings.groups?.length" class="border-t pt-2">
              <strong>Available Groups:</strong>
              <ul class="mt-1 space-y-1">
                <li v-for="group in storeInfo.settings.groups" :key="group"
                    class="text-xs px-2 py-1 rounded"
                    :class="group === storeInfo.settings.selectedGroup ? 'bg-green-200' : 'bg-gray-200'">
                  {{ group }}
                </li>
              </ul>
            </div>

            <div v-if="storeInfo.settings.settings" class="border-t pt-2">
              <strong>Settings:</strong>
              <div class="mt-1 text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto">
                <pre>{{ JSON.stringify(storeInfo.settings.settings, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Session Information (from server) -->
        <div v-if="tokenInfo?.sessionInfo" class="bg-slate-100  rounded-lg p-4">
          <h3 class="font-bold text-lg mb-4 flex items-center uppercase  border-b border-slate-300 pb-2">
            <i class="fa-light fa-cookie-bite mr-2 text-orange-500"></i>
            Server Session
          </h3>
          
          <div class="space-y-2 ">
            <div class="flex justify-between">
              <span class="font-medium">Has Session:</span>
              <span :class="tokenInfo.sessionInfo.hasSession ? 'text-green-600' : 'text-red-600'">
                {{ tokenInfo.sessionInfo.hasSession ? 'Yes' : 'No' }}
              </span>
            </div>
            <div><strong>Session User ID:</strong> {{ tokenInfo.sessionInfo.sessionUserId || 'N/A' }}</div>
            <div><strong>Session Customer ID:</strong> {{ tokenInfo.sessionInfo.sessionCustomerId || 'N/A' }}</div>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-semibold text-blue-800 mb-2">Testing Instructions:</h4>
        <ol class="text-blue-700  space-y-1 list-decimal list-inside">
          <li>Use "Test Token" to generate a token that expires in 5 seconds</li>
          <li>Use "Switch Customer" to change selectedCustomerId and observe store changes</li>
          <li>Use "Simulate Activity" to reset the inactivity timer and test activity tracking</li>
          <li>Watch the activity progress bar to see real-time inactivity countdown</li>
          <li>Monitor auto-refresh to see how activity status changes over time</li>
        </ol>
      </div>
    </div>
  </div>
</template>