import { createPinia } from 'pinia';

// Create a new Pinia instance to be used by the app
export const pinia = createPinia();

// Keep a simple array of all active stores
const allStores = [];

// Use a Pinia plugin to track every store that is instantiated
pinia.use((context) => {
  allStores.push(context.store);
});

/**
 * Resets all active Pinia stores to their initial state.
 * This is the function you'll call on logout.
 */
export function resetAllStores() {
  allStores.forEach((store) => {
    store.$reset();
  });
  // Clear the array after resetting to avoid memory leaks
  allStores.length = 0;
}