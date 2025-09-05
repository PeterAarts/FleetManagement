<script setup>
import Dialog from 'primevue/dialog';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:show']);

const handleVisibilityChange = (value) => {
  emit('update:show', value);
};
</script>

<template>
  <Dialog 
    :visible="show" 
    modal 
    @update:visible="handleVisibilityChange"
  >
    <template #header>
      <slot name="title">Default Title</slot>
    </template>
    
    <slot /> <template #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>