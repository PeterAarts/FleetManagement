<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { AlertTriangle, RefreshCw } from 'lucide-vue-next';

const REFRESH_INTERVAL_MINUTES = 15;
const countdown = ref(REFRESH_INTERVAL_MINUTES * 60);
let timerId = null;

const formattedCountdown = computed(() => {
  const minutes = Math.floor(countdown.value / 60);
  const seconds = countdown.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const retryConnection = () => {
  window.location.reload();
};

onMounted(() => {
  timerId = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      retryConnection();
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
});
</script>

<template>
  <div class="fixed inset-0 bg-gray-900 backdrop-blur-sm z-[100] flex items-center justify-center">
    <div class="bg-card border shadow-xl rounded-lg p-8 max-w-md w-full text-center">
      <AlertTriangle class="h-16 w-16 text-destructive mx-auto mb-4" />
      <h2 class="text-2xl font-bold mb-2">Connection Lost</h2>
      <p class="text-muted-foreground mb-6">
        The application is unable to connect to the server. Please check your internet connection.
      </p>
      
      <button @click="retryConnection" class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-semibold hover:bg-primary/90 transition-colors">
        Retry Now
      </button>

      <p class="text-sm text-muted-foreground mt-4">
        Automatically retrying in: {{ formattedCountdown }}
      </p>
    </div>
  </div>
</template>