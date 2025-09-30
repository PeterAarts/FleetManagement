<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { Layers, ZoomIn, ZoomOut, Maximize } from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet.awesome-markers';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-rotatedmarker';

// Define the events this component will emit to its parent
const emit = defineEmits(['request-open-options', 'marker-click']);

// Define the component's props, including new ones for selection tracking
const props = defineProps({
  markers: { type: Array, default: () => [] },
  popupVariant: { type: String, default: 'dashboard' },
  mapStyle: { type: String, default: 'standard' },
  trafficLayers: { type: Object, default: () => ({ incidents: false, flow: false }) },
  selectedMarkerId: [Number, String],
  hasActiveTrips: { type: Boolean, default: false }
});

const mapContainer = ref(null);
let map = null;
let markerClusterGroup = null;
let tileLayers = {}; // Object to hold all TomTom layer instances
let currentMarkers = new Map(); // Store marker references for selection styling

// --- Custom Marker Icons (Unchanged) ---
const markerIcons = {
  driving: L.AwesomeMarkers.icon({ icon: "truck", markerColor: "driving", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
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

// NEW: Zoom to specific location method
const zoomToLocation = (lat, lng, zoomLevel = 16) => {
  if (map) {
    map.setView([lat, lng], zoomLevel, {
      animate: true,
      duration: 1 // 1 second animation
    });
  }
};

function getMarkerIcon(statusObject) {
  if (!statusObject || typeof statusObject !== 'object' || Object.keys(statusObject).length === 0) return markerIcons.unknown;
  const priorityOrder = ['alert', 'error', 'driving', 'paused', 'delayed', 'stopped'];
  for (const status of priorityOrder) {
    if (statusObject[status]) return markerIcons[status];
  }
  return markerIcons.unknown;
}

// NEW: Apply selection styling to marker
const applyMarkerStyling = (marker, markerId) => {
  const isSelected = markerId === props.selectedMarkerId;
  
  if (marker._icon) {
    const markerElement = marker._icon;
    
    // Remove existing selection class
    markerElement.classList.remove('selected-marker');
    
    // Add selection class if this marker is selected
    if (isSelected) {
      markerElement.classList.add('selected-marker');
    }
  }
};

const updateMarkers = (markerDataArray) => {
  if (!map || !markerClusterGroup) return;
  
  // Clear existing markers and references
  markerClusterGroup.clearLayers();
  currentMarkers.clear();
  
  markerDataArray.forEach(markerData => {
    // Use the original AwesomeMarkers approach for precise positioning
    const marker = L.marker([markerData.lat, markerData.lng], { 
      icon: getMarkerIcon(markerData.status)
    });
    
    // Store marker reference for selection styling
    currentMarkers.set(markerData.id, marker);
    
    marker.bindTooltip(generatePopupContent(markerData), { 
      direction: 'top', 
      offset: L.point(0, -25), 
      className: 'custom-tooltip',
      opacity: 1
    });
    
    marker.on('click', () => {
      // Emit marker click event to parent
      emit('marker-click', markerData.id);
    });
    
    // Apply selection styling when marker is added to DOM
    marker.on('add', () => {
      // Apply selection styling
      applyMarkerStyling(marker, markerData.id);
      
      // Add direction arrow for driving vehicles
      const isDriving = markerData.status?.driving === true;
      const heading = markerData.location?.heading;
      
      if (isDriving && heading !== undefined && heading !== null) {
        const markerElement = marker._icon;
        if (markerElement) {
          // Create arrow element and append to marker
          const arrow = document.createElement('div');
          arrow.className = 'direction-arrow-overlay';
          arrow.style.transform = `rotate(${heading}deg)`;
          arrow.innerHTML = '<div class="arrow-pointer"></div>';
          markerElement.appendChild(arrow);
        }
      }
    });
    
    markerClusterGroup.addLayer(marker);
  });
};

// Update marker selection styling when selectedMarkerId changes
const updateMarkerSelection = () => {
  currentMarkers.forEach((marker, markerId) => {
    applyMarkerStyling(marker, markerId);
  });
};
const invalidateSize = () => {
  if (map) {
    // We use { animate: true } for a smooth transition
    map.invalidateSize({ animate: true });
  }
};
function generatePopupContent(markerData) {
  if (props.popupVariant === 'dashboard') {
    const driverName = markerData.drivers?.[0]?.driverName || 'No driver assigned';
    const driveTime = markerData.drivers?.[0]?.remainingDriveTime || '0:00';
    return `<div class="vehicle-tooltip-detailed">
              <div class="tooltip-header">
                <h3 class="vehicle-name">${markerData.customerVehicleName}</h3>
              </div>
              <div class="tooltip-content">
                <div class="tooltip-row">
                  <i class="fa-light fa-user tooltip-icon"></i>
                  <span class="tooltip-text">${driverName}</span>
                </div>
                <div class="tooltip-row">
                  <i class="fa-light fa-user-clock tooltip-icon"></i>
                  <span class="tooltip-text">${driveTime}</span>
                </div>
              </div>
            </div>`;
  } else if (props.popupVariant === 'map-view') {
    const driverName = markerData.drivers?.[0]?.driverName || 'Unknown Driver';
    const remainingDriveTime = markerData.drivers?.[0]?.remainingDriveTime || '0:00:00';
    const speed = markerData.currentSpeed ?? '0.0';
    const fuelLevel = markerData.fuelLevel || 'N/A';
    const lastActivity = markerData.lastActivity ? markerData.lastActivity : 'N/A';
    const hasWarnings = markerData.telltales?.length > 0 || markerData.damageCount > 0;
    const warningText = hasWarnings ? `${markerData.damageCount || 0} damages, ${markerData.telltales?.length || 0} warnings` : 'no warning lamps';
    
    return `
      <div class="vehicle-tooltip-detailed">
        <div class="tooltip-header">
          <h3 class="vehicle-name">${markerData.customerVehicleName}</h3>
        </div>
        <div class="tooltip-content">
          <div class="tooltip-row">
            <i class="fa-light fa-user tooltip-icon"></i>
            <span class="tooltip-text">${driverName}</span>
          </div>
          <div class="tooltip-row">
            <i class="fa-light fa-user-clock tooltip-icon"></i>
            <span class="tooltip-text">${remainingDriveTime}</span>
          </div>

          <div class="tooltip-row">
            <i class="fa-light fa-tachometer-alt tooltip-icon"></i>
            <span class="tooltip-text">${speed} km/h</span>
          </div>
          <div class="tooltip-row">
            <i class="fa-light fa-gas-pump tooltip-icon"></i>
            <span class="tooltip-text">${fuelLevel}%</span>
          </div>
          <div class="tooltip-row">
            <i class="fa-light fa-clock tooltip-icon"></i>
            <span class="tooltip-text">${lastActivity}</span>
          </div>
          <div class="tooltip-row">
            <i class="fa-light fa-exclamation-triangle tooltip-icon"></i>
            <span class="tooltip-text">${warningText}</span>
          </div>
        </div>
      </div>
    `;
  }
  return `<b>${markerData.customerVehicleName}</b>`;
}

function zoomToFitAllMarkers() {
  if (markerClusterGroup && markerClusterGroup.getBounds().isValid()) {
    map.fitBounds(markerClusterGroup.getBounds(), { padding: [10, 10] });
  }
}

onMounted(() => {
  if (!mapContainer.value) return;

  const apiKey = import.meta.env.VITE_TT_API_KEY;
  const apiKeyHere = import.meta.env.VITE_HERE_API_KEY;
  // Define all layers
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
    zoom: 1,
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
  
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 100);
});

// --- Watchers to handle dynamic updates from props ---

// NEW: Watcher for selected marker changes
watch(() => props.selectedMarkerId, () => {
  updateMarkerSelection();
});

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
  if (!props.hasActiveTrips) {
    zoomToFitAllMarkers();
  }
}, { deep: true });

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

defineExpose({
  zoomToLocation,
  getMapInstance: () => map,  // Expose the map instance getter
  invalidateSize
});
</script>

<template>
  <div class="map-container rounded-xl relative z-10" style="height: 100%; width: 100%" ref="mapContainer">
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
.map-container                {height: 100% !important; width: 100% !important;min-height: 100%; }
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
.leaflet-interactive:focus    {outline: none !important;}
.vehicle-tooltip-detailed     {padding: 12px 16px;border-radius: var(--radius);background-color: var(--card);box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);min-width: 180px;font-family:system-ui, -apple-system, BlinkMacSystemFont}
.tooltip-header               {font-weight: 600;color: var(--primary);margin-bottom: 6px;text-transform: uppercase;font-weight: 900;}
.tooltip-line                 {display: flex;align-items: center;gap: 8px;margin-bottom: 4px;;color: #4b5563;}
.tooltip-line:last-child      {margin-bottom: 0;}
.tooltip-marker               {width: 1.2em;text-align: center;color: #6b7280;font-size: 12px;}
.tooltip-icon                 {color:var(--color-primary-500); width:1.5rem; text-align: left}
.tooltip-row                  {display: flex;align-items: center;gap: 8px;margin-bottom: 4px;color: #4b5563;}
.tooltip-content              {margin-top: 8px;line-height: 1.4rem;font-size:inherit}
.tooltip-text                 {color:var(--card-foreground)}  

/* For the detailed map-view variant */
.vehicle-tooltip-detailed .font-bold 
                              {font-weight: 600;color: #1f2937;margin-bottom: 8px;}
.vehicle-tooltip-detailed .tooltip-line 
                              {display: flex;align-items: center;gap: 8px;margin-bottom: 4px;color: #4b5563;}
.vehicle-tooltip-detailed .tooltip-line:last-child 
                              {margin-bottom: 0;}
.leaflet-tooltip              {background-color:transparent!important;border: none !important;box-shadow: none !important;padding: 0 !important;margin: 0 !important;}

/* Remove the tooltip arrow/pointer */
.leaflet-tooltip-top:before,
.leaflet-tooltip-bottom:before,
.leaflet-tooltip-left:before,
.leaflet-tooltip-right:before {display: none !important;}

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

/* NEW: Selected marker styling */


@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

/* Simple, clean triangular arrow */
.direction-arrow-overlay {
  position: absolute;
  top: -7px;
  left: -7px;
  width: 40px;
  height: 40px;
  transform-origin: 20px 20px;
  pointer-events: none;
  z-index: 10;
  transition: transform 0.3s ease;
}

.arrow-pointer {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
}

/* Single clean triangular arrow */
.arrow-pointer::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(var(--color-primary-rgb), 0.9);
}
</style>