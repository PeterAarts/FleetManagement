<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { useDashboardStore } from '@/stores/dashboardStore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ArrowRight, X } from 'lucide-vue-next'; 

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const vehiclesStore = useVehiclesStore();
const dashboardStore = useDashboardStore();
const router = useRouter();
const route = useRoute();

const showLogin = ref(false);
const username = ref('');
const password = ref('');
const error = ref(null);
const sessionMessage = ref('');
const isLoading = ref(false);

onMounted(() => {
  if (route.query.reason === 'session-expired') {
    sessionMessage.value = 'Your session has expired. Please log in again.';
  }
  if (authStore.isAuthenticated) {
   console.warn('Authenticated user on /auth route. Forcing state reset.');
    authStore.resetAllApplicationState();
    return; 
  }
});

const handleLogin = async () => {
  error.value = null;
  isLoading.value = true;
  
  try {
    console.log('Step 1: Logging in...');
    await authStore.login({
      email: username.value,
      password: password.value,
    });
    
    console.log('Step 2: Fetching settings...');
    await settingsStore.fetchSettings();
    
    console.log('Step 3: Loading initial data...');
    // Load BOTH vehicles and dashboard data before navigating
    await Promise.all([
      vehiclesStore.fetchVehicles(),
      dashboardStore.fetchDashboardData()
    ]);
    
    console.log('Step 4: Navigation to dashboard');
    router.push({ name: 'dashboard' });
    
  } catch (err) {
    console.error('Login error:', err);
    if (err.response?.status === 403) {
      error.value = 'You do not have access to this application.';
    } else {
      error.value = err.response?.data?.message || 'Login failed.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="grid lg:grid-cols-4 min-h-screen bg-primary-800 text-white overflow-hidden">
    <div class="flex items-center justify-center  col-span-3 ">
      <div class="text-center p-24 rounded-xl bg-primary-950">
        <Truck class="mx-auto h-24 w-24 text-primary-300" />
        <h1 class="mt-4 text-4xl font-bold">Welcome to rFMS-Connect <br>Fleet Management </h1>
        <p class="mt-2 text-gray-400">Your robust and simple fleet management solution.</p>
        
        <Button 
          @click="showLogin = true"
          v-if="!showLogin"
          class="mt-8 bg-primary-500"
          size="lg"
        >
          Login to Your Account <ArrowRight class="ml-2 text-primary-400 h-5 w-5" />
        </Button>

        <p v-if="sessionMessage" class="my-6 text-red-400 p-3 rounded-md mx-auto ">
          {{ sessionMessage }}
        </p>
      </div>
      
    </div>

    <Transition name="slide-fade">
      <div v-if="showLogin" class="flex items-center justify-center bg-gray-100 text-black p-8">
        
        <Card class="w-full max-w-sm border-none shadow-lg bg-white relative">
     
          <Button 
            variant="ghost" 
            size="icon" 
            class="absolute top-4 right-4 rounded-full h-8 w-8" 
            @click="showLogin = false"
          >
            <X class="h-5 w-5" />

          </Button>

          <CardHeader>
            <CardTitle class="text-2xl text-left">Login</CardTitle>
            <CardDescription class="text-left text-muted">Enter your personal credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleLogin" class="grid gap-4">
              <div class="grid gap-2">
                <Label for="username">Username</Label>
                <Input id="username" type="email" placeholder="name@example.com" v-model="username" />
              </div>
              <div class="grid gap-2">
                <Label for="password">Password</Label>
                <Input id="password" type="password" v-model="password" />
              </div>
              <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
              <div class="flex items-center justify-between mt-2">
                <Button variant="link" class="p-0 text-gray-400 hover:text-primary-500">Forgot password?</Button>
                <Button type="submit" class="bg-primary-500 text-white">Login</Button>
              </div>
            </form>
            <div v-if="sessionMessage" class="my-4 bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
              {{ sessionMessage }}
            </div>
          </CardContent>
        </Card>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* The transition styles remain the same and handle both enter and leave animations */
.slide-fade-enter-active {
  transition: all 0.5s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>