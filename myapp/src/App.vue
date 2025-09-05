<script setup>
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

// This remains the same, handles initial login check
authStore.tryAutoLogin();

</script>

<template>
  <router-view />
</template>