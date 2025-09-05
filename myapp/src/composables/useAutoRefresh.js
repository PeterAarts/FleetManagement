import { onMounted, onUnmounted, watch, isRef } from 'vue';

/**
 * A Vue composable to automatically refresh data at a set interval.
 * It is now reactive to changes in the refresh rate.
 * @param {Function} refreshAction The function to call to refresh the data.
 * @param {Number|Ref} refreshRateInMinutes The interval in minutes, can be a number or a Vue ref.
 */
export function useAutoRefresh(refreshAction, refreshRateInMinutes) {
  let timer = null;

  const start = () => {
    if (timer) {
      clearInterval(timer); // Clear any existing timer before starting a new one
    }

    // ✅ UPDATED: Unwrap the value if it's a ref, otherwise use it directly.
    const rate = isRef(refreshRateInMinutes) ? refreshRateInMinutes.value : refreshRateInMinutes;
    
    if (!rate || rate <= 0) {
      console.log('Auto-refresh disabled: Invalid or zero refresh rate.');
      return;
    }
    
    const intervalMs = rate * 60 * 1000;
    console.log(`Auto-refresh enabled for this view every ${rate} minute(s).`);

    // Fetch immediately on start, then set the interval
    refreshAction();
    timer = setInterval(refreshAction, intervalMs);
  };

  const stop = () => {
    if (timer) {
      console.log('Auto-refresh stopped for this view.');
      clearInterval(timer);
    }
  };

  // ✅ UPDATED: Watch for changes in the refresh rate.
  // If it changes, the 'start' function will be called again to restart the timer.
  watch(refreshRateInMinutes, start, { immediate: true });

  // The timer is now started by the 'watch' with immediate: true, so onMounted is not needed.
  onUnmounted(stop);

  return { stop };
}