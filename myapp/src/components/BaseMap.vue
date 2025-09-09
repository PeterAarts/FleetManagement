<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { Layers, ZoomIn, ZoomOut, Maximize } from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet.awesome-markers';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Define the event this component will emit to its parent
const emit = defineEmits(['request-open-options']);

// Define the component's props, including new ones for map options
const props = defineProps({
  markers: { type: Array, default: () => [] },
  popupVariant: { type: String, default: 'dashboard' },
  mapStyle: { type: String, default: 'standard' },
  trafficLayers: { type: Object, default: () => ({ incidents: false, flow: false }) }
});

const mapContainer = ref(null);
let map = null;
let markerClusterGroup = null;
let tileLayers = {}; // Object to hold all TomTom layer instances

// --- Custom Marker Icons (Unchanged) ---
const markerIcons = {
  driving: L.AwesomeMarkers.icon({ icon: "arrow-up", markerColor: "driving", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  paused:  L.AwesomeMarkers.icon({ icon: "pause", markerColor: "paused", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  stopped: L.AwesomeMarkers.icon({ icon: "stop", markerColor: "stopped", iconSize: [26, 26],iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  delayed: L.AwesomeMarkers.icon({ icon: "clock-rotate-left", markerColor: "delayed", iconSize: [26, 26], iconAnchor: [13, 13],prefix: 'fa',shadowSize: [0, 0]}),
  error:   L.AwesomeMarkers.icon({ icon: "triangle-exclamation", markerColor: "orange", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  alert:   L.AwesomeMarkers.icon({ icon: "exclamation", markerColor: "delayed", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  unknown: L.AwesomeMarkers.icon({ icon: 'question', markerColor: 'gray', iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]})
};

// --- Custom Control Functions ---
const zoomIn = () => map?.zoomIn();
const zoomOut = () => map?.zoomOut();

function getMarkerIcon(statusObject) {
  if (!statusObject || typeof statusObject !== 'object' || Object.keys(statusObject).length === 0) return markerIcons.unknown;
  const priorityOrder = ['alert', 'error', 'driving', 'paused', 'delayed', 'stopped'];
  for (const status of priorityOrder) {
    if (statusObject[status]) return markerIcons[status];
  }
  return markerIcons.unknown;
}

const updateMarkers = (markerDataArray) => {
  if (!map || !markerClusterGroup) return;
  markerClusterGroup.clearLayers();
  markerDataArray.forEach(markerData => {
    const marker = L.marker([markerData.lat, markerData.lng], { icon: getMarkerIcon(markerData.status) });
    marker.bindTooltip(generatePopupContent(markerData), { direction: 'top', offset: L.point(0, -15), className: 'custom-tooltip' });
    marker.on('click', () => {
      map.setView([markerData.lat, markerData.lng], 16, { animate: true }); // Center and zoom to level 16
    });
    markerClusterGroup.addLayer(marker);
  });
};

function generatePopupContent(markerData) {
  // This is the existing logic for the dashboard
  if (props.popupVariant === 'dashboard') {
    const driverName = markerData.drivers?.[0]?.driverName || 'No driver assigned';
    const driveTime = markerData.drivers?.[0]?.remainingDriveTime || '0:00';
    return `<div class="vehicle-tooltip"><div class="card-title tooltip-line"><i class="fa fa-truck tooltip-marker"></i><span class="font-bold">${markerData.customerVehicleName}</span></div><div class="tooltip-line"><i class="fa fa-user tooltip-marker"></i><span>${driverName} (${driveTime})</span></div></div>`;
  } 
  // ADD THIS NEW 'ELSE IF' BLOCK for the map view
  else if (props.popupVariant === 'map-view') {
    const driverName = markerData.drivers?.[0]?.driverName || 'N/A';
    const license = markerData.license || '';
    const speed = markerData.speed ?? '0';
    const lastUpdate = markerData.lastUpdate || 'N/A';
    return `
      <div class="vehicle-tooltip-detailed">
        <div class="font-bold text-lg">${markerData.customerVehicleName} (${license})</div>
        <div class="tooltip-line"><span><i class="fa fa-user"></i> ${driverName}</span></div>
        <div class="tooltip-line"><span><i class="fa fa-tachometer-alt"></i> ${speed} km/u</span></div>
        <div class="tooltip-line"><span><i class="fa fa-clock"></i> ${lastUpdate}</span></div>
      </div>
    `;
  }
  return `<b>${markerData.customerVehicleName}</b>`;
}

function zoomToFitAllMarkers() {
  if (markerClusterGroup && markerClusterGroup.getBounds().isValid()) {
    map.fitBounds(markerClusterGroup.getBounds(), { padding: [50, 50] });
  }
}

onMounted(() => {
  if (!mapContainer.value) return;

  // IMPORTANT: Replace with your actual TomTom API Key
  const apiKey = 'qlmH59sLZa3TDpqBwQRxFh4wRNz0zpuw';
  const appIdHere = '1gLxnYT926SYYSFOGg0d';
  const apiKeyHere = '5eMjqywETj2V4Oh9E16rWJYEpSDxELGBJaspltN-0uU';
  // Define all TomTom layers
  tileLayers = {
    //standard: L.tileLayer(`https://api.tomtom.com/map/1/basic/main/{z}/{x}/{y}.png?key=${apiKey}`, { attribution: '&copy; TomTom' }),
    standard: L.tileLayer(`https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=${apiKeyHere}&lang=en&features=congestion_zones:all,environmental_zones:all,vehicle_restrictions:active_and_inactive,low_speed_zones:all,pois:all&style=logistics.day`, { attribution: '&copy; HERE' }),
    light: L.tileLayer(`https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=${apiKeyHere}&lang=en&style=lite.day`, { attribution: '&copy; HERE' }),
    dark: L.tileLayer(`https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=${apiKeyHere}&lang=en&features=congestion_zones:all,environmental_zones:all,vehicle_restrictions:active_and_inactive&style=logistics.night`, { attribution: '&copy; HERE' }),
    satellite: L.tileLayer(`https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=${apiKeyHere}&lang=en&features=congestion_zones:all,environmental_zones:all,vehicle_restrictions:active_and_inactive&style=logistics.satellite.day`, { attribution: '&copy; HERE' }),
    trafficIncidents: L.tileLayer(`https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${apiKey}`),
    trafficFlow: L.tileLayer(`https://api.tomtom.com/traffic/map/4/tile/flow/absolute/s3/{z}/{x}/{y}.png?key=${apiKey}`),
   
  };
  
  map = L.map(mapContainer.value, {
    center: [45.85, 5.69],
    zoom:1,
    zoomControl: false,
    layers: [tileLayers.standard], 
  });

  markerClusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 80,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let sizeClass = 'small';
      if (count > 10) sizeClass = 'medium';
      if (count > 100) sizeClass = 'large';
      return L.divIcon({ html: `<div><span>${count}</span></div>`, className: `marker-cluster marker-cluster-${sizeClass}`, iconSize: L.point(40, 40) });
    }
  });

  map.addLayer(markerClusterGroup);
  updateMarkers(props.markers);
  zoomToFitAllMarkers();
});

// --- Watchers to handle dynamic updates from props ---

// Watcher for Map Style changes
let currentMapLayer = 'standard';
watch(() => props.mapStyle, (newStyleId) => {
  if (map && tileLayers[newStyleId] && newStyleId !== currentMapLayer) {
    map.removeLayer(tileLayers[currentMapLayer]);
    map.addLayer(tileLayers[newStyleId]);
    currentMapLayer = newStyleId;
  }
});

// Watcher for Traffic Layer changes
watch(() => props.trafficLayers, (newTraffic) => {
  if (!map) return;
  // Handle Incidents Layer
  if (newTraffic.incidents && !map.hasLayer(tileLayers.trafficIncidents)) {
    map.addLayer(tileLayers.trafficIncidents);
  } else if (!newTraffic.incidents && map.hasLayer(tileLayers.trafficIncidents)) {
    map.removeLayer(tileLayers.trafficIncidents);
  }
  // Handle Flow Layer
  if (newTraffic.flow && !map.hasLayer(tileLayers.trafficFlow)) {
    map.addLayer(tileLayers.trafficFlow);
  } else if (!newTraffic.flow && map.hasLayer(tileLayers.trafficFlow)) {
    map.removeLayer(tileLayers.trafficFlow);
  }
}, { deep: true });

// Watcher for Marker updates
watch(() => props.markers, (newMarkers) => {
  updateMarkers(newMarkers);
  zoomToFitAllMarkers();
}, { deep: true });

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="map-container relative z-10" style="height: 100%; width: 100%" ref="mapContainer">
    <div class="map-controls">
      <div class="control-group">
        <button class="control-button" @click="emit('request-open-options')">
          <Layers :size="18 " />
        </button>
      </div>
      <div class="control-group">
        <button class="control-button" @click="zoomIn">
          <ZoomIn :size="18" />
        </button>
        <button class="control-button" @click="zoomOut">
          <ZoomOut :size="18" />
        </button>
        <button class="control-button" @click="zoomToFitAllMarkers">
          <Maximize :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container                {background-color: #f0f0f0; }
.map-controls                 {position: absolute;bottom: 2rem;right: 1rem;display: flex;flex-direction: column;gap: 0.75rem;z-index: 1000;}
.control-group                {display: flex;flex-direction: column;gap: 1px;background-color: white;border-radius: 8px;overflow: hidden;}
.control-button               {background-color: white;border: none;padding: 10px;cursor: pointer;display: flex;align-items: center;justify-content: center;
                               color: #374151;transition: background-color 0.2s;}
.control-button:hover         {background-color: rgba(var(--color-primary-rgb), 0.3);}
.control-button:first-child   {border-top-left-radius: 8px; border-top-right-radius: 8px; }
.control-button:last-child    {border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
</style>

<style>
/* Global styles required by Leaflet plugins. */
.vehicle-tooltip              {padding: .5rem;border-radius: 8px;background-color: rgb(185, 55, 55);border: 1px solid #e5e7eb;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.tooltip-line                 {display: flex; align-items: center; gap: 8px; }
.tooltip-marker               {width: 1.2em;text-align: center;color: #2563eb; /* Hard-coded fallback color */}

/* Base style for all clusters */
.marker-cluster               {background-clip: padding-box;border-radius: 20px;}
.marker-cluster div           {width: 30px;height: 30px;margin-left: 5px;margin-top: 5px;text-align: center;border-radius: 15px;font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;color: white;}
.marker-cluster span          {line-height: 30px;}

/* Specific cluster colors */
.marker-cluster-small         {background-color: rgba(var(--color-primary-rgb), 0.6);}
.marker-cluster-small div     {background-color: rgba(var(--color-primary-rgb), 0.8);}
.marker-cluster-medium        {background-color: rgba(var(--color-primary-rgb), 0.6);}
.marker-cluster-medium div    {background-color: rgba(var(--color-primary-rgb), 0.8);}
.marker-cluster-large         {background-color: rgba(var(--color-primary-rgb), 0.6);}
.marker-cluster-large div     {background-color: rgba(var(--color-primary-rgb), 0.8);}
</style>