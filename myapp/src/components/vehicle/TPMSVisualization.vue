<script setup>
import { computed } from 'vue';

const props = defineProps({
  tpmsData: Object,
  type: String,
  frontAxleCount: {
    type: Number,
    default: 0
  }
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
  return Object.keys(groups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(axle => ({
      axle: parseInt(axle),
      sensors: groups[axle]
    }));
});

// Create a computed property for front axles
const frontAxles = computed(() => {
  return axleGroups.value.slice(0, props.frontAxleCount);
});

// Create a computed property for rear axles
const rearAxles = computed(() => {
  return axleGroups.value.slice(props.frontAxleCount);
});

// Helper functions
const getSensorByPosition = (axleSensors, position) => {
  return axleSensors.find(sensor => parseInt(sensor.position) === position);
};
const getTireBadgeClass = (sensor) => {
  return sensor.alert ? 'tire-badge alert' : 'tire-badge normal';
};
const formatPressure = (pressure) => {
  return parseFloat(pressure).toFixed(2);
};
</script>

<template>
  <div class="tpms-container">
    <div class="tpms-header">
      <h4 class="font-medium uppercase text-gray-900 mb-3">{{ type }}</h4>
      <div class="flex items-center gap-2">
        <i v-if="tpmsData.issues > 0" class="fa-light fa-triangle-exclamation text-red-500"></i>
        <i v-else class="fa-light fa-circle-check text-green-500"></i>
        <span class="text-sm">{{ tpmsData.issues }} issue{{ tpmsData.issues !== 1 ? 's' : '' }}</span>
        <span class="text-xs text-gray-500 ml-auto">{{ tpmsData.lastUpdate }}</span>
        <i class="fa-light fa-clock text-gray-400"></i>
      </div>
    </div>

    <div class="tpms-visual-horizontal">
      
      <div v-if="frontAxles.length > 0" class="axle-group FrontAxel">
        <div v-for="axleGroup in frontAxles" :key="axleGroup.axle" class="axle-column">
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 4)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 4))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 4)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 4)?.pressure) }}</div></div>
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 3)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 3))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 3)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 3)?.pressure) }}</div></div>
          <div class="axle-badge-slot"><div class="axle-badge">{{ axleGroup.axle }}</div></div>
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 2)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 2))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 2)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 2)?.pressure) }}</div></div>
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 1)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 1))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 1)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 1)?.pressure) }}</div></div>
        </div>
      </div>
      
      <div v-if="rearAxles.length > 0" class="axle-group RearAxel">
        <div v-for="axleGroup in rearAxles" :key="axleGroup.axle" class="axle-column">
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 4)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 4))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 4)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 4)?.pressure) }}</div></div>
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 3)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 3))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 3)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 3)?.pressure) }}</div></div>
          <div class="axle-badge-slot"><div class="axle-badge">{{ axleGroup.axle }}</div></div>
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 2)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 2))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 2)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 2)?.pressure) }}</div></div>
          <div class="tire-slot"><div v-if="getSensorByPosition(axleGroup.sensors, 1)" :class="getTireBadgeClass(getSensorByPosition(axleGroup.sensors, 1))" :title="`Sensor: ${getSensorByPosition(axleGroup.sensors, 1)?.sensorid}`">{{ formatPressure(getSensorByPosition(axleGroup.sensors, 1)?.pressure) }}</div></div>
        </div>
      </div>

    </div>

    <div class="tpms-footer">
      <i class="fa-light fa-tire text-gray-500"></i>
      <span class="text-xs text-gray-600">{{ tpmsData.device || tpmsData.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.tpms-container         {background: white;border-radius: 8px;padding: 16px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);}
.tpms-header            {border-bottom: 1px solid #e5e7eb;padding-bottom: 8px;margin-bottom: 16px;}
.tpms-visual-horizontal {display: flex;align-items: center;padding: 0;border: 1px dashed var(--color-primary-300);border-radius: 8px;min-height: 150px;position: relative;}
.tpms-visual-horizontal::before 
                        {content: '';position: absolute;left: 1rem;right: 1rem;top: 50%;border-top: 2px dashed #d1d5db;transform: translateY(-1px);z-index: 1; }
.axle-group             {display: flex;align-items: center;gap: .75rem;padding: 0 8px;background-color: var(--body);z-index: 1;}
.RearAxel               {margin-left: auto;border-top-right-radius: 8px;border-bottom-right-radius: 8px;}
.FrontAxel              {margin-left: 0px;padding-right:2rem;border-top-left-radius: 8px;border-bottom-left-radius: 8px;}
.axle-column            {display: flex;flex-direction: column;gap: 4px;align-items: center;width: 4rem;padding: 4px 0;position: relative;}
.axle-column::before    {content: '';position: absolute;top: 1.5rem;bottom: 1.5rem;left: 50%;border-left: 2px dashed #d1d5db;transform: translateX(-1px);z-index: 0; }
.tire-slot, 
.axle-badge-slot        {height: 25px;width: 100%;display: flex;align-items: center;justify-content: center;}
.tire-badge             {color: white;padding: 2px 10px;border-radius: 25%;text-align: center;font-weight: bold;font-size: 11px;width: 100%;position: relative;z-index: 1;}
.tire-badge.alert       {background: #c43939;}
.tire-badge.normal      {background: var(--color-primary);}
.axle-badge             {background: #f3f4f6;border: 1px solid #d1d5db;border-radius: 50%;width: 24px;height: 24px;display: flex;align-items: center;justify-content: center;font-size: 10px;font-weight: bold;color: #6b7280;position: relative;z-index: 1;}
.tpms-footer            {display: flex;align-items: center;gap: 8px;justify-content: left;padding-top: 12px;border-top: 1px solid #f3f4f6;}
</style>