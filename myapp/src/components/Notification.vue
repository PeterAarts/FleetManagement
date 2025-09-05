<!-- File: src/components/Notification.vue -->
<template>
  <div class="notification-container">
    <transition-group name="list" tag="div">
      <div v-for="notification in notifications" :key="notification.id"
           :class="['notiflix-report', `notiflix-report-${notification.type}`]">
        <div class="notiflix-report-body">
          <div class="notiflix-report-title">{{ notification.type.charAt(0).toUpperCase() + notification.type.slice(1) }}</div>
          <div class="notiflix-report-content">{{ notification.message }}</div>
        </div>
        <span @click="removeNotificationById(notification.id)" class="notiflix-close-button">&times;</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotifier } from '@/composables/useNotifier';
const { notifications, removeNotification } = useNotifier();

// This helper function is fine, but you can also call removeNotification directly from the template
const removeNotificationById = (id) => removeNotification(id);
</script>

<style scoped>
.notification-container     { position: fixed;bottom: 20px;right: 20px;z-index: 9999;width: 420px;}
.notiflix-report            { position: relative;border-radius: 8px;padding: 15px;margin-bottom: 10px;color: #fff;box-shadow: 0 4px 15px rgba(0,0,0,0.2);display: flex;justify-content: space-between;align-items: flex-start;}
.notiflix-report-success    { background-color: #28a745; }
.notiflix-report-failure    { background-color: #dc3545; }
.notiflix-report-warning    { background-color: #ffc107; color: #212529; }
.notiflix-report-info       { background-color: #17a2b8; }
.notiflix-report-body       { flex-grow: 1; }
.notiflix-report-title      { font-weight: bold; margin-bottom: 5px; }
.notiflix-close-button      { cursor: pointer; font-size: 24px; line-height: 1; margin-left: 15px; opacity: 0.8; }
.notiflix-close-button:hover { opacity: 1; }
.list-enter-active, .list-leave-active { transition: all 0.5s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(30px); }
</style>
