<script setup>
import Header from '@/components/Header.vue';
// We no longer need to import the specific dashboard panels here
</script>

<template>
  <div class="flex h-screen flex-col bg-body ">
    <Header />

    <main class="flex-grow overflow-y-auto">
      <router-view />
    </main>
    
    </div>
</template>