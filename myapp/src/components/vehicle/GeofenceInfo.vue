<script setup>
import { computed } from 'vue';
import { useGeofenceStore } from '@/stores/geofenceStore';
import { storeToRefs } from 'pinia';

const props = defineProps({
  cachedData: {
    type: Array,
    default: () => []
  },
  vehicleId: {
    type: [Number, String],
    required: true
  }
});

const geofenceStore = useGeofenceStore();
const { activeGeofences } = storeToRefs(geofenceStore);

const groupedEvents = computed(() => {
  if (!props.cachedData || props.cachedData.length === 0) return [];
  
  const groups = new Map();
  props.cachedData.forEach(event => {
    const date = event.date;
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(event);
  });
  
  return Array.from(groups, ([date, events]) => ({ date, events }));
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });
};

const toggleGeofenceOnMap = (eventId) => {
  geofenceStore.toggleGeofenceDisplay(props.vehicleId, eventId);
};
</script>

<template>
  <div class="card p-4 rounded-md">
    <h4 class="font-bold text-md mb-4 px-2">GEOFENCE EVENTS</h4>
    
    <div v-if="groupedEvents.length > 0">
      <div v-for="group in groupedEvents" :key="group.date" class="timeline-group">
        
        <div class="date-header">
          <div class="timeline-dot"></div>
          <span>{{ formatDate(group.date) }}</span>
        </div>
        
        <div class="events-list">
          <div 
            v-for="event in group.events" 
            :key="event.id"
            class="event-row"
            :class="{ 'active-event': activeGeofences[event.id] }"
            @click="toggleGeofenceOnMap(event.id)"
          >
            <div class="event-time">
              <span>{{ formatTime(event.timestamp) }}</span>
            </div>
            <div class="geofence-name">
              <span>{{ event.geofenceName }}</span>
            </div>
            <div class="event-type">
              <span class="text-xs" :class="event.type === 'enter' ? 'text-green-600' : 'text-orange-600'">
                {{ event.type === 'enter' ? 'ENTER' : 'EXIT' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-gray-500 text-sm text-center py-8">
      No geofence events found.
    </div>
  </div>
</template>

<style scoped>
/* Reuse the same timeline styles from TripsInfo.vue */
.timeline                 {overflow-y: auto;}
.timeline-group           {position: relative;padding-left: 20px;}
.timeline-group::before   {content: '';position: absolute;left: 4px;top: 18px;bottom: -8px;width: 2px;background-color: var(--color-secondary-300);}
.date-header              {display: flex;align-items: center;font-size: 85%;color: var(--color-secondary-900);margin: .5rem 0;}
.timeline-dot             {position: absolute;left: 0;width: 10px;height: 10px;border-radius: 9999px;background-color: transparent;border: 2px solid var(--color-secondary-300);}
.events-list              {display: flex;flex-direction: column;gap: 0.5rem;}
.event-row                {display: flex;align-items: center;gap: 0.75rem;padding:0.5rem ;background-color: transparent;border-radius: 0.375rem;font-size: 0.875rem;cursor: pointer;transition: background-color 0.2s;}
.event-row:hover          {background-color: var(--color-secondary-300);}
.event-time               {display: flex;align-items: left;gap: 0.375rem;font-weight: 600;min-width: 40px;}
.geofence-name            {flex-grow: 1;display: flex;align-items: center;text-align:left;gap: 0.375rem;  color: #6b7280;}
.event-type               {min-width: 20px;text-align: right;}
i                         {width: 16px;text-align: center;}
.active-event             {border-left: 3px solid var(--color-primary-600) !important;font-weight: 600;border-radius: 0 6px 6px 0;}
.active-event .geofence-name,
.active-event .event-time {color: var(--color-primary-700);}
</style>