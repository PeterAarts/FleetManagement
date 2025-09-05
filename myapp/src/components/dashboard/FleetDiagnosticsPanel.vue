<script setup>
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from './StatusBadge.vue';

// Import all the Lucide icons you might need
import {
  Hammer,         // for fa-tools (Damages)
  Shapes,         // for fa-draw-polygon (Geofence)
  Wrench,         // for fa-wrench (Maintenance)
  AlertTriangle,  // for fa-exclamation-triangle (Telltales)
  User,           // for fa-user (Driver 1)
  Users,          // for fa-solid fa-user + fa-light fa-user (Driver 2)
  TowerControl,   // for fa-broadcast-tower (Delayed)
  Fuel,           // for fa-gas-pump (Fuel Incidents)
  BatteryWarning, // for fa-car-battery (Battery Issues)
  Droplet,        // for fa-oil-can-drip (Oil Level)
  Gauge,          // for fa-tire-pressure-warning & fa-tachometer-alt (Tire & Speeding)
  Cog,            // for fa-engine-warning (Engine)
  Route,          // for fa-route (ETA)
  CalendarClock,  // for fa-calendar-circle-user (Driving Time)
} from 'lucide-vue-next';

// This is the main prop that will come from your dashboardStore
const props = defineProps({
  diagnosticsData: {
    type: Object,
    default: () => ({})
  }
});

// This configuration array maps API data keys to the UI (icon and tooltip).
// It makes the component easy to manage and extend.
const diagnosticItemsConfig = [
  { key: 'severeDamages', icon: Hammer, tooltip: 'Vehicles with severe damage' },
  { key: 'geofenceTriggers', icon: Shapes, tooltip: 'Vehicles with an active geofence trigger' },
  { key: 'maintenanceOverdue', icon: Wrench, tooltip: 'Vehicles with overdue maintenance' },
  { key: 'activeTelltales', icon: AlertTriangle, tooltip: 'Vehicles with active telltale warnings' },
  { key: 'fuelIncidents', icon: Fuel, tooltip: 'Vehicles with a registered fuel incident' },
  { key: 'batteryIssues', icon: BatteryWarning, tooltip: 'Vehicles with a battery issue' },
  { key: 'oilLevelWarnings', icon: Droplet, tooltip: 'Vehicles with an oil level warning' },
  { key: 'tireWarnings', icon: Gauge, tooltip: 'Vehicles with a TPMS warning' },
  { key: 'engineWarnings', icon: Cog, tooltip: 'Vehicles with an engine warning' },
  { key: 'etaNotMet', icon: Route, tooltip: 'Vehicles not meeting expected ETA' },
  { key: 'speedingDrivers', icon: Gauge, tooltip: 'Currently speeding drivers' },
  { key: 'driveTimeExceeded', icon: CalendarClock, tooltip: 'Drivers exceeding drive time limits' },
  // Note: Driver counts are usually shown in the "Driver Status" panel, but can be added here if needed.
];

// A computed property to automatically filter and prepare the list of visible badges.
// It only includes items where the count is greater than 0.
const visibleDiagnostics = computed(() => {
  return diagnosticItemsConfig
    .map(item => ({
      ...item,
      value: props.diagnosticsData[item.key] || 0
    }))
    .filter(item => item.value > 0);
});
</script>

<template>
  <Card class="lg:col-span-2">
    <CardHeader>
      <CardTitle>Fleet Diagnostics</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-wrap items-center gap-2">
      <div v-if="visibleDiagnostics.length === 0" class="text-sm text-gray-500">
        No active issues.
      </div>
      <StatusBadge 
        v-for="item in visibleDiagnostics"
        :key="item.key"
        :icon="item.icon"
        :value="item.value"
        :tooltip="item.tooltip"
      />
    </CardContent>
  </Card>
</template>