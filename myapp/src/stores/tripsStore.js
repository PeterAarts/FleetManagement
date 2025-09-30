import { defineStore } from 'pinia';
import apiClient from '@/tools/apiClient';

export const useTripsStore = defineStore('trips', {
  state: () => ({
    isLoading: false,
    // CHANGED: From a single trip to an object to hold multiple trips
    activeTrips: {}, 
    error: null,
  }),
  
  actions: {
    // NEW: Toggles a trip's visibility
    async toggleTripDetails(vehicleId, tripId) {
      // If trip is already active, remove it and stop.
      if (this.activeTrips[tripId]) {
        delete this.activeTrips[tripId];
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const response = await apiClient.get(`/vehicles/${vehicleId}/trips/${tripId}`);
        // Add the fetched trip to our activeTrips object using its ID as the key
        this.activeTrips[tripId] = response.data;
      } catch (err) {
        console.error(`Failed to fetch trip details for trip ${tripId}:`, err);
        this.error = `Could not load data for trip ${tripId}.`;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Action to clear all trips, e.g., when the vehicle changes
    clearAllActiveTrips() {
      this.activeTrips = {};
    },
  },
});