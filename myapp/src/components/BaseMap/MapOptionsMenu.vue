<script setup>
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';

defineProps({
  isOpen: { type: Boolean, default: false },
  currentStyle: { type: String, required: true },
});

const emit = defineEmits(['close', 'update:style', 'update:traffic']);

// --- Local State ---
const selectedStyle = ref('standard');
const trafficOptions = ref({
  incidents: false,
  flow: false,
});

const mapStyles = ref([
  { id: 'standard', name: 'Standard', image: '/map-previews/standard.png' },
  { id: 'light', name: 'Light', image: '/map-previews/light.png' },
  { id: 'dark', name: 'Dark', image: '/map-previews/dark.png' },
  { id: 'satellite', name: 'Satellite', image: '/map-previews/satellite.png' },
]);
const poiOptions = ref({
  workshops: false,
  truckParking: false,
});

// --- Methods ---
function selectStyle(styleId) {
  selectedStyle.value = styleId;
  emit('update:style', styleId);
}

// --- Watchers to automatically emit changes ---
watch(trafficOptions, (newVal) => {
  emit('update:traffic', newVal);
}, { deep: true });

</script>

<template>
  <div class="map-options-menu">
    <div class="header border-0">
      <h3>Map options</h3>
      <button @click="emit('close')" class="close-btn"><X :size="20" /></button>
    </div>

    <!-- Map Styles Section -->
    <div class="section">
      <h4 class="section-title">MAP STYLES</h4>
      <div class="style-grid">
        <div 
          v-for="style in mapStyles" 
          :key="style.id" 
          class="style-item"
          :class="{ 'selected': selectedStyle === style.id }"
          @click="selectStyle(style.id)"
        >
          <img :src="style.image" :alt="style.name" class="style-preview">
          <span>{{ style.name }}</span>
        </div>
      </div>
    </div>

    <!-- Traffic Section -->
    <div class="section">
      <h4 class="section-title">TRAFFIC</h4>
      <div class="checkbox-group">
        <label>
          <input type="checkbox" v-model="trafficOptions.incidents" />
          Traffic incidents
        </label>
        <label>
          <input type="checkbox" v-model="trafficOptions.flow" />
          Traffic flow
        </label>
      </div>
    </div>
    
    <!-- POIs Section  -->
    <div class="section">
      <h4 class="section-title">POINTS OF INTEREST</h4>
      <div class="checkbox-group">
        <label>
          <input type="checkbox" v-model="poiOptions.workshops" />
          Workshops
        </label>
        <label>
          <input type="checkbox" v-model="poiOptions.truckParking" />
          Truck parking
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles from previous steps are correct */
.map-options-menu {
  width: 250px;
  height: 100%;
  background-color: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.header h3 { font-size: 1.1rem; font-weight: 600; }
.close-btn { background: none; border: none; cursor: pointer; color: #6b7280; }
.section { padding: 1rem 1.5rem; }
.section-title {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}
.style-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.style-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.8rem;
  cursor: pointer;
  border: 2px solid transparent;
  padding: 0.25rem;
  border-radius: 6px;
}
.style-item.selected {
  border-color: #e5e7eb;
  border-width: 2px;
  color:var(--color-primary);
  font-weight: 700;
  background-color: var(--color-secondary);
}
.style-preview {
  width: 100%;
  height: 60px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: #f3f4f6;
}
.checkbox-group label {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}
.checkbox-group input { margin-right: 0.75rem; width: 16px; height: 16px; }
</style>