import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/tools/apiClient';

export const useGeofenceStore = defineStore('geofence', () => {
  const geofenceDefinitions = ref(new Map());
  const geofenceEvents = ref(new Map());
  const activeGeofences = ref({}); // BACK to object
  
  const toggleGeofenceDisplay = async (vehicleId, geofenceEventId) => {
    const eventId = parseInt(geofenceEventId, 10);
    const isActive = activeGeofences.value[eventId];
    
    if (isActive) {
      activeGeofences.value = {}; // Clear all
    } else {
      if (!geofenceEvents.value.has(eventId)) {
        await loadGeofenceEventData(vehicleId, eventId);
      }
      activeGeofences.value = { [eventId]: true };
    }
  };
  
  const loadGeofenceEventData = async (vehicleId, geofenceEventId) => {
    try {
      const eventId = parseInt(geofenceEventId, 10);
      const response = await apiClient.get(`/vehicles/${vehicleId}/geofence/${eventId}`);
      
      const eventData = {
        id: eventId,
        geofenceName: response.data.geofenceName,
        geofenceDefId: response.data.geofenceDefId,
        eventTrigger: response.data.eventTrigger,
        timestamp: response.data.timestamp,
        contextPoints: response.data.contextPoints
      };
      
      geofenceEvents.value.set(eventId, eventData);
      
      if (!geofenceDefinitions.value.has(eventData.geofenceDefId)) {
        await loadGeofenceDefinition(eventData.geofenceDefId);
      }
      
    } catch (error) {
      console.error('Error loading geofence event data:', error);
      throw error;
    }
  };
  
  const loadGeofenceDefinition = async (geofenceDefId) => {
    try {
      const defId = parseInt(geofenceDefId, 10);
      const response = await apiClient.get(`/geofences/${defId}`);
      
      geofenceDefinitions.value.set(defId, {
        id: response.data.id,
        name: response.data.name,
        type: response.data.type,
        isPoi: response.data.isPoi,
        boundary: response.data.boundary
      });
      
    } catch (error) {
      console.error('Error loading geofence definition:', error);
      throw error;
    }
  };
  
  const clearAllActiveGeofences = () => {
    activeGeofences.value = {};
  };
  
  const getActiveGeofenceData = computed(() => {
    // Find active event
    const activeId = Object.keys(activeGeofences.value).find(id => activeGeofences.value[id]);
    if (!activeId) return null;
    
    const eventId = parseInt(activeId, 10);
    const eventData = geofenceEvents.value.get(eventId);
    if (!eventData) return null;
    
    const definitionData = geofenceDefinitions.value.get(eventData.geofenceDefId);
    
    return {
      ...eventData,
      boundary: definitionData?.boundary || null
    };
  });
  
  return {
    geofenceDefinitions,
    geofenceEvents,
    activeGeofences,
    toggleGeofenceDisplay,
    clearAllActiveGeofences,
    getActiveGeofenceData
  };
});