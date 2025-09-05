<script setup>
import { useNotifier } from '@/composables/useNotifier';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

const { confirmation, handleConfirmation } = useNotifier();

const iconMap = {
  danger: 'pi-exclamation-triangle',
  warning: 'pi-exclamation-triangle',
  info: 'pi-info-circle',
};

const iconColorMap = {
  danger: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};
</script>

<template>
  <Dialog
    v-model:visible="confirmation.isVisible"
    modal
    :header="confirmation.title || 'Confirmation'"
    :style="{ width: '25rem' }"
    :closable="false"
  >
    <div class="flex items-center">
      <i 
        class="pi text-4xl mr-4" 
        :class="[iconMap[confirmation.alertType], iconColorMap[confirmation.alertType]]"
      ></i>
      <p class="text-slate-700">{{ confirmation.message }}</p>
    </div>
    <template #footer>
      <Button label="Cancel" severity="secondary" @click="handleConfirmation(false)" />
      <Button label="OK" severity="primary" @click="handleConfirmation(true)" autofocus />
    </template>
  </Dialog>
</template>