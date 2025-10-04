<script setup>
import { watchEffect, ref, onUnmounted } from 'vue';
import { useTripsStore } from '@/stores/tripsStore';
import { storeToRefs } from 'pinia';
import L from 'leaflet';

const { activeTrips } = storeToRefs(useTripsStore());

const props = defineProps({
  map: { type: Object, default: null }
});

const tripLayers = ref(new Map());
const startIcon = L.icon({iconUrl: '/images/StartMarker.png', iconSize: [32, 32],iconAnchor: [16, 32],});
const endIcon   = L.icon({iconUrl: '/images/EndMarker.png', iconSize: [32, 32],iconAnchor: [16, 32],});

// --- Helper Functions ---
const formatTimestamp = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};
const generateTripPopup = (trip) => {
  const details = trip.tripDetails;
  const events = trip.events || [];
  const startTime = formatTimestamp(events[0]?.timestamp);
  const endTime = formatTimestamp(events[events.length - 1]?.timestamp);
  const driver = details.vehicle || 'N/A'; 
  return `
  <div class="trip-popup rounded-xl ">
    <div class="popup-title">TRIP</div>
    <div class="popup-row"><i class="fa-light fa-flag"></i><span>${startTime}</span></div>
    <div class="popup-row"><i class="fa-light fa-route"></i><span>${details.distance} km</span></div>
    <div class="popup-row"><i class="fa-light fa-hourglass-half"></i><span>${details.duration}</span></div>
    <div class="popup-row"><i class="fa-light fa-user"></i><span>${driver}</span></div>
    <div class="popup-row"><i class="fa-solid fa-flag-checkered"></i><span>${endTime}</span></div>
  </div>`;
};
const generateEventTooltip = (event) => {
  let additionalInfo = '';
    if (event.type === 'DRIVER_1_WORKING_STATE_CHANGED' || event.type === 'DRIVER_2_WORKING_STATE_CHANGED') {
    const workingState = event.driver1WorkingState || event.driver2WorkingState || 'N/A';
    additionalInfo = `<div class="popup-row"><i class="fa-light fa-briefcase"></i><span class="font-medium">${workingState}</span></div>`;
  } else if (event.type === 'TELL_TALE' && (event.tellTale_State === 'RED' || event.tellTale_State === 'YELLOW')) {
    const telltaleInfo = event.tellTale  || 'N/A';
    additionalInfo = `<div class="popup-row"><i class="fa-light text-danger fa-triangle-exclamation"></i><span class="font-medium text-danger-500">${telltaleInfo}</span></div>`;
  }
  return `
    <div class="event-tooltip rounded-xl p-4 shadow-xl">
      <div class="popup-title">${event.type.replace(/_/g, ' ')}</div>
      <div class="popup-row"><i class="fa-light fa-clock"></i><span class="font-medium">${formatTimestamp(event.timestamp)}</span></div>
      <div class="popup-row"><i class="fa-light fa-road"></i><span>${event.totalDistanceKm} km</span></div>
      <div class="popup-row"><i class="fa-light fa-gauge-high"></i><span>${event.wheelBasedSpeed} km/h</span></div>
      ${additionalInfo}
    </div>`;
};


// --- The definitive watcher using watchEffect ---
watchEffect(() => {
  const mapInstance = props.map;
  const currentActiveTrips = activeTrips.value;

  if (!mapInstance) {
    // If map is not ready, do nothing. The effect will re-run automatically when it is.
    return;
  }

  const activeTripIds = Object.keys(currentActiveTrips);
  const displayedTripIds = Array.from(tripLayers.value.keys());

  // 1. Remove layers that are no longer active
  displayedTripIds.forEach(tripId => {
    if (!activeTripIds.includes(tripId)) {
      const layerToRemove = tripLayers.value.get(tripId);
      if (layerToRemove) {
        mapInstance.removeLayer(layerToRemove);
        tripLayers.value.delete(tripId);
      }
    }
  });

  // 2. Add layers for newly activated trips
  activeTripIds.forEach(tripId => {
    if (!displayedTripIds.includes(tripId)) {
      const tripData = currentActiveTrips[tripId];
      const allLayers = [];
      const eventsWithCoords = tripData.events?.filter(
        e => e.latitude != null && e.longitude != null && !(e.latitude === 0 && e.longitude === 0)
      );
      
      if (eventsWithCoords?.length > 0) {
        const coords = eventsWithCoords.map(e => [e.latitude, e.longitude]);
        const polyline = L.polyline(coords, { color: 'var(--color-primary-500)', weight: 5, opacity: 0.95 });
        polyline.bindPopup(generateTripPopup(tripData));
        allLayers.push(polyline);
        
        eventsWithCoords.forEach((event, index) => {
          let marker;
          let markerFillColor = 'var(--color-primary)';
          let markerColor = 'white';
          if (index === 0) {
            marker = L.marker([event.latitude, event.longitude], { icon: startIcon });
          } else if (index === eventsWithCoords.length - 1) {
            marker = L.marker([event.latitude, event.longitude], { icon: endIcon });
          }  
          if (event.type === 'TELL_TALE' && (event.tellTale_State === 'RED' || event.tellTale_State === 'YELLOW')) { markerFillColor = 'red' ;markerColor ='red';}
          else if (event.type === 'HARSH_ACCELERATION') { markerFillColor = 'red';}
          else if (event.type === 'HARSH_BRAKING') { markerFillColor = 'blue';}
          else if (event.type === 'GEOFENCE_ENTER' || event.type === 'GEOFENCE_EXIT') { markerFillColor = 'green';}
          marker = L.circleMarker([event.latitude, event.longitude], { radius: 5, fillColor: markerFillColor, color: markerColor, weight: 2, fillOpacity: 1 });
          if (marker) {
            marker.bindTooltip(generateEventTooltip(event), { direction: 'top', offset: [-50, -10], opacity : 1.0 });
            allLayers.push(marker);
          }
        });
        
        const newLayerGroup = L.featureGroup(allLayers).addTo(mapInstance);
        tripLayers.value.set(tripId, newLayerGroup);
      }
    }
  });

  // 3. Zoom to fit all currently displayed trips
  const allBounds = [];
  tripLayers.value.forEach(layer => allBounds.push(layer.getBounds()));
  if (allBounds.length > 0) {
    const combinedBounds = allBounds.reduce((b, c) => b.extend(c));
    if (combinedBounds.isValid()) {
      mapInstance.invalidateSize(); // Ensure map size is correct before fitting
      mapInstance.fitBounds(combinedBounds, { padding: [50, 50] });
    }
  }
});

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
  background-color: #fff;
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
  margin: .45rem 0;
}
.popup-row i {
  margin-right:1rem;
  text-align: center;
  color: var(--color-primary-500);
}
</style>