<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import apiClient from '@/tools/apiClient';

// Shadcn component imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Lucide icon imports
import { Truck, ArrowRight, X } from 'lucide-vue-next'; 

// State to control the visibility of the login panel
const showLogin = ref(false);

// ... existing script logic for the form ...
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref(null);

const handleLogin = async () => {
  error.value = null;
  try {
    // 1. Log in and get the token
    await authStore.login({
      email: username.value,
      password: password.value,
    });
    // 2. Fetch settings now that we are authenticated
    await settingsStore.fetchSettings();
    // 3. Redirect to the dashboard
    router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = 'Login failed. Please check your credentials.';
  }
};
</script>

<template>
  <div class="grid lg:grid-cols-4 min-h-screen bg-sky-950 text-white overflow-hidden">
    <div class="flex items-center justify-center p-8 col-span-3">
      <div class="text-center">
        <Truck class="mx-auto h-16 w-16" />
        <h1 class="mt-4 text-4xl font-bold">Welcome to Fleet Management NXT</h1>
        <p class="mt-2 text-gray-400">The next generation of fleet monitoring and management.</p>
        
        <Button 
          @click="showLogin = true"
          v-if="!showLogin"
          class="mt-8 bg-primary"
          size="lg"
        >
          Login to Your Account <ArrowRight class="ml-2 h-5 w-5" />
        </Button>
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
                <Button variant="link" class="p-0">Forgot password?</Button>
                <Button type="submit" class="bg-primary">Login</Button>
              </div>
            </form>
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