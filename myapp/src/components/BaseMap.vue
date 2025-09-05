<template>
  <div ref="mapContainer" style="height: 100%; width: 100%" class="relative z-10"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet.awesome-markers';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Define the component's props
const props = defineProps({
  markers: { type: Array, default: () => [] },
  popupVariant: { type: String, default: 'dashboard' }
});

const mapContainer = ref(null);
let map = null;
let markerClusterGroup = null;
let accuracyCirclesGroup = null; 

// --- Your original custom Marker Icons ---
const markerIcons = {
  driving: L.AwesomeMarkers.icon({ icon: "location-arrow-up", markerColor: "driving", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  paused:  L.AwesomeMarkers.icon({ icon: "pause", markerColor: "paused", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  stopped: L.AwesomeMarkers.icon({ icon: "stop", markerColor: "stopped", iconSize: [26, 26],iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  delayed: L.AwesomeMarkers.icon({ icon: "clock-rotate-left", markerColor: "delayed", iconSize: [26, 26], iconAnchor: [13, 13],prefix: 'fa',shadowSize: [0, 0]}),
  error:   L.AwesomeMarkers.icon({ icon: "triangle-exclamation", markerColor: "orange", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  alert:   L.AwesomeMarkers.icon({ icon: "exclamation", markerColor: "delayed", iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]}),
  unknown: L.AwesomeMarkers.icon({ icon: 'question', markerColor: 'gray', iconSize: [26, 26], iconAnchor: [13, 13], prefix: 'fa',shadowSize: [0, 0]})
};

// ✅ --- THIS IS THE ONLY PART THAT HAS BEEN CHANGED ---
function getMarkerIcon(statusObject) {
  if (!statusObject || typeof statusObject !== 'object' || Object.keys(statusObject).length === 0) {
    return markerIcons.unknown;
  }
  
  const priorityOrder = ['alert', 'error', 'driving', 'paused', 'delayed', 'stopped'];

  for (const status of priorityOrder) {
    if (statusObject[status]) {
      return markerIcons[status];
    }
  }
  return markerIcons.unknown;
}
// --------------------------------------------------------

const updateMarkers = (markerDataArray) => {
  if (!map || !markerClusterGroup || !accuracyCirclesGroup) {
    return;
  }
  markerClusterGroup.clearLayers();
  accuracyCirclesGroup.clearLayers();

  markerDataArray.forEach(markerData => {
    const marker = L.marker([markerData.lat, markerData.lng], {
      icon: getMarkerIcon(markerData.status),
      rotationAngle: markerData.heading || 0,
      rotationOrigin: 'center center'
    });
    marker.on('click', (e) => {
      const detailZoomLevel = 16; 
      map.setView(e.latlng, detailZoomLevel);
    });

    marker.bindTooltip(generatePopupContent(markerData),
      {  direction: 'top',offset: L.point(0,-15), className: 'custom-tooltip' } );
    markerClusterGroup.addLayer(marker);

    const accuracyCircle = L.circle([markerData.lat, markerData.lng], {
      radius: 20,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.2
    });
    accuracyCirclesGroup.addLayer(accuracyCircle);
  });
  
  zoomToFitAllMarkers();
};

function generatePopupContent(markerData) {
 if (props.popupVariant === 'dashboard') {
    const driverName = markerData.drivers?.[0]?.driverName || 'No driver assigned';
    const driveTime = markerData.drivers?.[0]?.remainingDriveTime || '0:00';
    return `
      <div class="vehicle-tooltip">
        <div class="card-title tooltip-line ">
          <i class="fa fa-truck tooltip-marker"></i>
          <span class="font-bold">${markerData.customerVehicleName}</span>
        </div>
        <div class="tooltip-line">
          <i class="fa fa-user tooltip-marker"></i>
          <span>${driverName} (${driveTime})</span>
        </div>
      </div>
    `;
  } 
  else if (props.popupVariant === 'detail') {
    const trailerInfo = markerData.trailerName ? `<span class="VehicleListInfo">(${markerData.trailerName})</span>` : '';
    const driverInfo = markerData.drivers?.[0]?.driverCardId ? `
      <div class="d-flex"><div class="tooltipicon"><i class="fa-light fa-user text-secondary"></i></div><div class="tooltiptxt">${markerData.drivers[0].driverName}</div></div>
      <div class="d-flex"><div class="tooltipicon"><i class="fa-light fa-user-clock text-secondary"></i></div><div class="tooltiptxt">${markerData.drivers[0].remainingDriveTime}</div></div>
      <div class="d-flex"><div class="tooltipicon"><i class="fa-light fa-utensils text-secondary"></i></div><div class="tooltiptxt">${markerData.drivers[0].remainingRestTime}</div></div>
    ` : '';
    
    return `
      <div class="card">
        <div class="card-title py-2"><b>${markerData.customerVehicleName}</b> ${trailerInfo}</div>
        <div class="card-body py-2">
          ${driverInfo}
          </div>
      </div>
    `;
  }
  
  return `<b>${markerData.customerVehicleName}</b>`;
}

function zoomToFitAllMarkers() {
  if (markerClusterGroup && markerClusterGroup.getBounds().isValid()) {
    map.fitBounds(markerClusterGroup.getBounds(), {  removeOutsideVisibleBounds: false });
  }
}

onMounted(() => {
  if (!mapContainer.value) return;

  const tileLayers = {
    "HERE Truck": L.tileLayer('https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=YOUR_HERE_API_KEY&lang=en&style=topo.day', { attribution: '&copy; HERE' }),
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }),
  };
  
  map = L.map(mapContainer.value, {
    center: [50.85, 5.69], 
    zoom: 7,
    layers: [tileLayers["OpenStreetMap"]]
  });

  markerClusterGroup = L.markerClusterGroup({showCoverageOnHover: false,maxClusterRadius: 40,zoomToBoundsOptions: {padding: [100, 100]}});
  accuracyCirclesGroup = L.layerGroup();
  map.addLayer(markerClusterGroup);
  //map.addLayer(accuracyCirclesGroup);

    const overlays = { 
    "Vehicles": markerClusterGroup,
    "Accuracy Circles": accuracyCirclesGroup 
  };
  L.control.layers(tileLayers, overlays).addTo(map);

  const ZoomToFitControl = L.Control.extend({
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      container.innerHTML = `<a href="#" title="Zoom to fit all markers" role="button"><i class="fa-solid fa-expand"></i></a>`;
      container.style.backgroundColor = 'white';
      container.style.cursor = 'pointer';
      L.DomEvent.disableClickPropagation(container);
      container.onclick = function(e) {
        e.preventDefault();
        zoomToFitAllMarkers();
      };
      
      return container;
    }
  });

  new ZoomToFitControl({ position: 'topleft' }).addTo(map);
  updateMarkers(props.markers);
});

watch(() => props.markers, (newMarkers) => {
  updateMarkers(newMarkers);
}, { deep: true });

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style>
/* Your original styles are preserved */
.leaflet-tooltip.custom-leaflet-tooltip {
  padding: 0;
  background-color: transparent;
  border: none;
  box-shadow: none;
}
.vehicle-tooltip {
  padding: .5rem;
  margin: 0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tooltip-line {display: flex;align-items: center;gap: 8px;}
.tooltip-line .fa-solid {width: 1.2em;text-align: center;color: #6b7280;}
.tooltip-marker {width: 1.2em;text-align: center;color: var(--color-primary)}
.marker-cluster-small,
.marker-cluster-medium,
.marker-cluster-large {background-color: var(--color-primary-light);border-color: var(--color-primary);}
.marker-cluster-small div,
.marker-cluster-medium div,
.marker-cluster-large div {background-color: var(--color-primary);   opacity: .8;border-color: var(--color-primary);color: white;}
.marker-cluster-small span,
.marker-cluster-medium span,
.marker-cluster-large span {text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);}
</style>