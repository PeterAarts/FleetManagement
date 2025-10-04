<script setup>
import { watch, onUnmounted } from 'vue';
import { useGeofenceStore } from '@/stores/geofenceStore';
import { storeToRefs } from 'pinia';
import L from 'leaflet';

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
});

const geofenceStore = useGeofenceStore();
const { getActiveGeofenceData } = storeToRefs(geofenceStore);

let geofenceLayers = [];

const clearGeofenceLayers = () => {
  geofenceLayers.forEach(layer => {
    if (props.map && props.map.hasLayer(layer)) {
      props.map.removeLayer(layer);
    }
  });
  geofenceLayers = [];
};

const drawGeofence = (geofenceData) => {
  if (!geofenceData || !props.map) return;
  
  clearGeofenceLayers();
  
  // Draw the geofence boundary
  let boundaryLayer;
  if (geofenceData.boundary.type === 'circle') {
    boundaryLayer = L.circle(
      [geofenceData.boundary.coordinates.lat, geofenceData.boundary.coordinates.lng],
      {
        radius: geofenceData.boundary.radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2
      }
    );
  } else if (geofenceData.boundary.type === 'polygon') {
    boundaryLayer = L.polygon(
      geofenceData.boundary.coordinates.map(coord => [coord.lat, coord.lng]),
      {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2
      }
    );
  }
  
  if (boundaryLayer) {
    boundaryLayer.addTo(props.map);
    geofenceLayers.push(boundaryLayer);
  }
  
  // Draw the context points (2 before, trigger, 2 after)
  if (geofenceData.contextPoints && geofenceData.contextPoints.length > 0) {
    const polylinePoints = geofenceData.contextPoints.map(point => [point.lat, point.lng]);
    
    // Draw connecting line
    const polyline = L.polyline(polylinePoints, {
      color: '#ef4444',
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 5'
    }).addTo(props.map);
    geofenceLayers.push(polyline);
    
    // Draw markers for each context point
    geofenceData.contextPoints.forEach((point, index) => {
      const isTriggerPoint = index === 2; // Middle point is the trigger
      
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: isTriggerPoint ? 8 : 5,
        fillColor: isTriggerPoint ? '#ef4444' : '#f59e0b',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(props.map);
      
      if (isTriggerPoint) {
        marker.bindTooltip('Geofence Trigger', { permanent: false });
      }
      
      geofenceLayers.push(marker);
    });
    
    // Fit bounds to show all context points
    const bounds = L.latLngBounds(polylinePoints);
    props.map.fitBounds(bounds, { padding: [50, 50] });
  }
};

watch(getActiveGeofenceData, (newData) => {
  if (newData) {
    drawGeofence(newData);
  } else {
    clearGeofenceLayers();
  }
});

onUnmounted(() => {
  clearGeofenceLayers();
});
</script>

<template>
  <!-- This component has no visual template, it only manipulates the map -->
  <div style="display: none;"></div>
</template>