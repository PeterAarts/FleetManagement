<!-- src/components/TomTomMap.vue -->
<template>
  <!-- The map container div -->
  <div ref="mapContainer" style="height: 100%; width: 100%"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const props = defineProps({
  markers: { type: Array, default: () => [] },
});

const mapContainer = ref(null);
let map = null;

onMounted(() => {
  if (mapContainer.value) {
    // 1. Initialize the map
    map = tt.map({
      key: 'qlmH59sLZa3TDpqBwQRxFh4wRNz0zpuw',
      container: mapContainer.value,
      center: [5.69, 50.85], // Note: TomTom uses [lng, lat] order
      zoom: 7,
    });

    // 2. Add markers
    props.markers.forEach(marker => {
      // TomTom's marker creation is different
      new tt.Marker()
        .setLngLat([marker.lng, marker.lat])
        .setPopup(new tt.Popup({ offset: 35 }).setText(marker.popupText))
        .addTo(map);
    });
  }
});

// Clean up the map instance when the component is destroyed
onUnmounted(() => {
  if (map) {
    map.remove();
  }
});
</script>