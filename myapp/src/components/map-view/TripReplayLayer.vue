<script setup>
import { watch, onUnmounted, ref } from 'vue';
import { useTripsStore } from '@/stores/tripsStore';
import { storeToRefs } from 'pinia';
import L from 'leaflet';

// CHANGED: Watch 'activeTrips'
const { activeTrips } = storeToRefs(useTripsStore());

const props = defineProps({
  map: { type: Object, required: true }
});

// Use a Map to store references to the Leaflet layer for each trip
const tripLayers = ref(new Map());
const startIcon = L.icon({iconUrl: '/images/StartMarker.png', iconSize: [32, 32],iconAnchor: [16, 32],});
const endIcon   = L.icon({iconUrl: '/images/EndMarker.png', iconSize: [32, 32],iconAnchor: [16, 32],});

// --- Helper Functions (can be moved to a separate file if desired) ---
const formatTimestamp = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};
const generateTripTooltip = (trip) => {
  const details = trip.tripDetails;
  const events = trip.events || [];
  const startTime = formatTimestamp(events[0]?.timestamp);
  const endTime = formatTimestamp(events[events.length - 1]?.timestamp);
  const driver = details.vehicle || 'N/A'; 
  return `<div class="trip-popup rounded-xl "><div class="popup-title">TRIP</div><div class="popup-row"><i class="fa-light text-primary fa-flag"></i><span>${startTime}</span></div><div class="popup-row"><i class="fa-light text-primary fa-route"></i><span>${details.distance} km</span></div><div class="popup-row"><i class="fa-light text-primary fa-hourglass-half"></i><span>${details.duration}</span></div><div class="popup-row"><i class="fa-light text-primary fa-user"></i><span>${driver}</span></div><div class="popup-row"><i class="fa-duotone fa-flag-checkered"></i><span>${endTime}</span></div></div>`;
};
const generateEventTooltipContent = (event) => {
  return `<div class="event-tooltip rounded-xl p-4"><div class="popup-title">${event.type.replace(/_/g, ' ')}</div><div class="popup-row"><i class="fa-light text-primary fa-clock"></i><span>${formatTimestamp(event.timestamp)}</span></div><div class="popup-row"><i class="fa-light text-primary fa-road"></i><span>${event.totalDistanceKm} km</span></div><div class="popup-row"><i class="fa-light text-primary fa-gauge-high"></i><span>${event.wheelBasedSpeed} km/h</span></div></div>`;
};

function displayTripAndEvents(tripData) {
  if (currentTripLayerGroup.value) props.map.removeLayer(currentTripLayerGroup.value);
  if (!tripData?.events || !props.map) return;

  const allLayers = [];
  const eventsWithCoords = tripData.events.filter(e => e.latitude != null && e.longitude != null && !(e.latitude === 0 && e.longitude === 0));

  if (eventsWithCoords.length > 0) {
    const coords = eventsWithCoords.map(e => [e.latitude, e.longitude]);
    const polyline = L.polyline(coords, { color: 'var(--color-primary)', weight: 5, opacity: 1 });
    polyline.bindTooltip(generateTripTooltip(tripData), { opacity: 1, sticky: true });
    allLayers.push(polyline);
    
    // UPDATED: Loop through events with an index to identify start, end, and middle points
    eventsWithCoords.forEach((event, index) => {
      let marker;

      if (index === 0) {
        marker = L.marker([event.latitude, event.longitude], { icon: startIcon });
      } else if (index === eventsWithCoords.length - 1) {
        marker = L.marker([event.latitude, event.longitude], { icon: endIcon });
      } else {
        // All other events: Use the circle marker
        marker = L.circleMarker([event.latitude, event.longitude], {
          radius: 5,
          fillColor: 'var(--color-primary-500)',
          color: 'white',
          weight: 2,
          fillOpacity: 1
        });
      }  
      marker.bindTooltip(generateEventTooltipContent(event), {opacity: 1, direction: 'top', offset: [0, -10] });
      allLayers.push(marker);
    });
  }

  if (allLayers.length > 0) {
    currentTripLayerGroup.value = L.featureGroup(allLayers).addTo(props.map);
    props.map.fitBounds(currentTripLayerGroup.value.getBounds(), { padding: [50, 50] });
  }
}
// --- Watcher to sync the map with the store ---
watch(activeTrips, (newActiveTrips) => {
  if (!props.map) return;

  const activeTripIds = Object.keys(newActiveTrips);
  const displayedTripIds = Array.from(tripLayers.value.keys());

  // 1. Remove layers that are no longer active
  displayedTripIds.forEach(tripId => {
    if (!activeTripIds.includes(tripId)) {
      const layerToRemove = tripLayers.value.get(tripId);
      if (layerToRemove) {
        props.map.removeLayer(layerToRemove);
        tripLayers.value.delete(tripId);
      }
    }
  });

  // Add layers for newly activated trips
  activeTripIds.forEach(tripId => {
    if (!displayedTripIds.includes(tripId)) {
      const tripData = newActiveTrips[tripId];
      const allLayers = [];
      const eventsWithCoords = tripData.events?.filter(
        e => e.latitude != null && e.longitude != null && !(e.latitude === 0 && e.longitude === 0)
      );
      
      
      if (eventsWithCoords?.length > 0) {
        const coords = eventsWithCoords.map(e => [e.latitude, e.longitude]);
        const polyline = L.polyline(coords, { color: 'var(--color-primary-500)', weight: 5, opacity: 0.95 });
        polyline.bindPopup(generateTripTooltip(tripData), { opacity: 1, sticky: true });
        allLayers.push(polyline);
        
        eventsWithCoords.forEach(event => {
          const marker = L.circleMarker([event.latitude, event.longitude], { radius: 5, fillColor: 'var(--color-primary-500)', color: 'white', weight: 2, fillOpacity: 1 });
          marker.bindTooltip(generateEventTooltipContent(event), { direction: 'top', offset: [0, -10] });
          allLayers.push(marker);
        });
        
        const newLayerGroup = L.featureGroup(allLayers).addTo(props.map);
        tripLayers.value.set(tripId, newLayerGroup);
      }
    }
  });

  // Zoom to fit all currently displayed trips
  const allBounds = [];
  tripLayers.value.forEach(layer => {
    allBounds.push(layer.getBounds());
  });
  if (allBounds.length > 0) {
    const combinedBounds = allBounds.reduce((bounds, current) => bounds.extend(current));
    if (combinedBounds.isValid()) {
      props.map.fitBounds(combinedBounds, { padding: [50, 50] });
    }
  }

}, { deep: true });

// Cleanup when the component is unmounted
onUnmounted(() => {
  tripLayers.value.forEach(layer => {
    if (props.map && layer) {
      props.map.removeLayer(layer);
    }
  });
  tripLayers.value.clear();
});
</script>

<template>
  <div></div>
</template>
<style>
.trip-popup, .event-tooltip {
  font-family: system-ui, -apple-system, sans-serif;
}
.popup-title {
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary-500);
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}
.popup-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: .75rem;
}
.popup-row i {
  width: 16px;
  text-align: center;
  color: #6b7280;
}
</style>