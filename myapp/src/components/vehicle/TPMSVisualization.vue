<!-- TPMSVisualization.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  tpmsData: Object,
  type: String // 'vehicle' or 'trailer'
});

// Group sensors by axle
const axleGroups = computed(() => {
  if (!props.tpmsData?.sensors) return [];
  
  const groups = {};
  props.tpmsData.sensors.forEach(sensor => {
    if (!groups[sensor.axle]) {
      groups[sensor.axle] = [];
    }
    groups[sensor.axle].push(sensor);
  });
  
  // Sort axles and return as array
  return Object.keys(groups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(axle => ({
      axle: parseInt(axle),
      sensors: groups[axle].sort((a, b) => parseInt(b.position) - parseInt(a.position))
    }));
});

// Find sensor by position for an axle
const getSensorByPosition = (axleSensors, position) => {
  return axleSensors.find(sensor => parseInt(sensor.position) === position);
};

// Determine tire badge class based on alert status
const getTireBadgeClass = (sensor) => {
  if (!sensor) return 'empty-badge';
  return sensor.alert ? 'tire-badge alert' : 'tire-badge normal';
};

// Format pressure value
const formatPressure = (pressure) => {
  return parseFloat(pressure).toFixed(2);
};
</script>

<template>
  <div class="tpms-container">
    <!-- Issue count and timestamp header -->
    <div class="tpms-header">
      <div class="flex items-center gap-2">
        <i v-if="tpmsData.issues > 0" class="fa-light fa-triangle-exclamation text-red-500"></i>
        <i v-else class="fa-light fa-circle-check text-green-500"></i>
        <span class="text-sm">{{ tpmsData.issues }} issue{{ tpmsData.issues !== 1 ? 's' : '' }}</span>
        <span class="text-xs text-gray-500 ml-auto">{{ tpmsData.lastUpdate }}</span>
        <i class="fa-light fa-clock text-gray-400"></i>
      </div>
    </div>

    <!-- TPMS Visual Layout -->
    <div class="tpms-visual">
      <div v-for="axleGroup in axleGroups" :key="axleGroup.axle" class="axle-row">
        
        <!-- Left side tires (positions 4 and 3) -->
        <div class="tire-column left">
          <!-- Position 4 (outer left) -->
          <div 
            v-if="getSensorByPosition(axleGroup.sensors, 4)"
            :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 4))"
            :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 4)?.sensorid} | Temp: ${getSensorByPosition(axleGroup.sensors, 4)?.temperature}°C`"
          >
            <span class="pressure-value">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 4)?.pressure) }}</span>
          </div>
          
          <!-- Position 3 (inner left) -->
          <div 
            v-if="getSensorByPosition(axleGroup.sensors, 3)"
            :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 3))"
            :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 3)?.sensorid} | Temp: ${getSensorByPosition(axleGroup.sensors, 3)?.temperature}°C`"
          >
            <span class="pressure-value">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 3)?.pressure) }}</span>
          </div>
          <div v-else class="empty-badge"></div>
        </div>

        <!-- Axle number in center -->
        <div class="axle-center">
          <div class="axle-badge">
            <span class="axle-number">{{ axleGroup.axle }}</span>
          </div>
        </div>

        <!-- Right side tires (positions 2 and 1) -->
        <div class="tire-column right">
          <!-- Position 2 (inner right) -->
          <div 
            v-if="getSensorByPosition(axleGroup.sensors, 2)"
            :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 2))"
            :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 2)?.sensorid} | Temp: ${getSensorByPosition(axleGroup.sensors, 2)?.temperature}°C`"
          >
            <span class="pressure-value">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 2)?.pressure) }}</span>
          </div>
          <div v-else class="empty-badge"></div>

          <!-- Position 1 (outer right) -->
          <div 
            v-if="getSensorByPosition(axleGroup.sensors, 1)"
            :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 1))"
            :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 1)?.sensorid} | Temp: ${getSensorByPosition(axleGroup.sensors, 1)?.temperature}°C`"
          >
            <span class="pressure-value">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 1)?.pressure) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Device info footer -->
    <div class="tpms-footer">
      <i class="fa-light fa-tire text-gray-500"></i>
      <span class="text-xs text-gray-600">{{ tpmsData.device || tpmsData.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.tpms-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tpms-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.tpms-visual {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  min-height: 120px;
  position: relative;
}

.axle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.axle-row:last-child {
  margin-bottom: 0;
}

.tire-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.tire-column.left {
  align-items: flex-end;
}

.tire-column.right {
  align-items: flex-start;
}

.tire-badge {
  background: #3b82f6;
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  text-align: center;
  font-weight: bold;
  font-size: 12px;
  min-width: 60px;
  position: relative;
}

.tire-badge.alert {
  background: #ef4444;
}

.tire-badge.normal {
  background: #3b82f6;
}

.empty-badge {
  height: 28px;
  min-width: 60px;
}

.pressure-value {
  font-size: 11px;
  font-weight: bold;
}

.axle-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
}

.axle-badge {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #6b7280;
}

.axle-number {
  font-size: 10px;
}

.tpms-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}
</style>