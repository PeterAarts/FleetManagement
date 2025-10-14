// ============================================
// FILE: src/composables/useAutoRefresh.js (FIXED)
// ============================================
import { onMounted, onUnmounted, watch, isRef } from 'vue';

/**
 * A Vue composable to automatically refresh data at a set interval.
 * It is now reactive to changes in the refresh rate.
 * @param {Function} refreshAction The function to call to refresh the data.
 * @param {Number|Ref} refreshRateInMinutes The interval in minutes, can be a number or a Vue ref.
 * @param {Boolean} callImmediately Whether to call refreshAction immediately on start (default: true for backward compatibility)
 */
export function useAutoRefresh(refreshAction, refreshRateInMinutes, callImmediately = true) {
  let timer = null;

  const start = () => {
    if (timer) {
      clearInterval(timer); // Clear any existing timer before starting a new one
    }

    // Unwrap the value if it's a ref, otherwise use it directly.
    const rate = isRef(refreshRateInMinutes) ? refreshRateInMinutes.value : refreshRateInMinutes;
    
    if (!rate || rate <= 0) {
      console.log('Auto-refresh disabled: Invalid or zero refresh rate.');
      return;
    }
    
    const intervalMs = rate * 60 * 1000;
    console.log(`Auto-refresh enabled: every ${rate} minute(s)${callImmediately ? ' (immediate call)' : ''}`);

    // Only fetch immediately if callImmediately is true
    if (callImmediately) {
      refreshAction();
    }
    
    timer = setInterval(refreshAction, intervalMs);
  };

  const stop = () => {
    if (timer) {
      console.log('Auto-refresh stopped for this view.');
      clearInterval(timer);
      timer = null;
    }
  };

  // Watch for changes in the refresh rate.
  // If it changes, the 'start' function will be called again to restart the timer.
  watch(() => refreshRateInMinutes, start, { immediate: true });

  onUnmounted(stop);

  return { stop };
}