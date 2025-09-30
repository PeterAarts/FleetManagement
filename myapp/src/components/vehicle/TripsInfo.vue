<script setup>
import { computed } from 'vue';
import { useTripsStore } from '@/stores/tripsStore';
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
const tripsStore = useTripsStore();
const { activeTrips } = storeToRefs(tripsStore);

const groupedTrips = computed(() => {
  if (!props.cachedData || props.cachedData.length === 0) return [];
  const groups = new Map();
  props.cachedData.forEach(trip => {
    const date = trip.date;
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(trip);
  });
  return Array.from(groups, ([date, trips]) => ({ date, trips }));
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

// UPDATED: Renamed function and changed the action it calls
const toggleTripOnMap = (tripId) => {
  tripsStore.toggleTripDetails(props.vehicleId, tripId);
};
</script>

<template>
  <div class="card p-4 rounded-md">
    <h4 class="font-bold text-md mb-4 px-2">TRIPS</h4>
    
    <div v-if="groupedTrips.length > 0">
      <div v-for="group in groupedTrips" :key="group.date" class="timeline-group">
        
        <div class="date-header">
          <div class="timeline-dot"></div>
          <span>{{ formatDate(group.date) }}</span>
        </div>
        
        <div class="trips-list">
          <div 
            v-for="trip in group.trips" 
            :key="trip.id"
            class="trip-row"
            :class="{ 'active-trip': activeTrips[trip.id] }"
            @click="toggleTripOnMap(trip.id)"
          >
            <div class="trip-time start-time">
              <i class="fa-light fa-flag text-slate-500"></i>
              <span>{{ trip.startTime }}</span>
            </div>
            <div class="tacho-id">
              <i class="fa-light fa-user text-slate-500"></i>
              <span>{{ trip.driverName }}</span>
            </div>
            <div class="trip-time end-time">
              <span>{{ trip.endTime }}</span>
              <i class="fa-duotone fa-flag-checkered text-slate-500"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-gray-500 text-sm text-center py-8">
      No recent trips found.
    </div>
  </div>
</template>

<style scoped>
.timeline-group {
  position: relative;
  padding-left: 20px;
}
/* The main vertical timeline bar */
.timeline-group::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 18px;
  bottom: -8px;
  width: 2px;
  background-color: var(--color-secondary-300); 
}
.date-header {
  display: flex;
  align-items: center;
  font-size: 85%;
  color: var(--color-secondary-900);
  margin: .5rem 0;
}
.timeline-dot {
  position: absolute;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background-color: transparent;
  border: 2px solid var(--color-secondary-300);
}
.trips-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* 8px */
}
.trip-row {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px */
  padding: 0.5rem; /* 8px */
  background-color:transparent;
  border-radius: 0.375rem; /* 6px */
  font-size: 0.875rem; /* 14px */
  cursor: pointer;
  transition: background-color 0.2s;
}
.trip-row:hover {
  background-color: var(--color-secondary-300); /* gray-200 */
}
.trip-bar {
  width: 4px;
  height: 20px;
  background-color:transparent;
  border-radius: 2px;
}
.trip-bar.active {
  width: 4px;
  height: 20px;
  background-color: #6b7280; /* gray-500 */
  border-radius: 2px;
}
.trip-time {
  display: flex;
  align-items: center;
  gap: 0.375rem; /* 6px */
  font-weight: 600;
}
.tacho-id {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 0.375rem; /* 6px */
  color: #6b7280; /* gray-500 */
}
.map-icon {
  color: #6b7280; /* gray-500 */
}
i {
  width: 16px;
  text-align: center;
}

:deep(::-webkit-scrollbar) {
  width: 4px;
}
:deep(::-webkit-scrollbar-track) {
  background: transparent;
}
:deep(::-webkit-scrollbar-thumb) {
  background-color: transparent;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}
/* Show the scrollbar thumb when hovering over the scrollable area */
:hover :deep(::-webkit-scrollbar-thumb) {
  background-color: var(--color-primary-300);
}
.active-trip {
  border-left: 3px solid var(--color-primary-600) !important;
  font-weight: 600;
  border-radius: 0 6px 6px 0;
}
.active-trip .tacho-id,
.active-trip .trip-time {
  color: var(--color-primary-700);
}
</style>