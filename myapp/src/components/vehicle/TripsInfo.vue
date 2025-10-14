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
  },
  layout: {
    type: String,
    default: 'card', // 'card' or 'table'
    validator: (value) => ['card', 'table'].includes(value),
  }
});
const tripsStore = useTripsStore();
const { activeTrips } = storeToRefs(tripsStore);

// Process the raw data once for use in both layouts
const processedTrips = computed(() => {
  if (!props.cachedData || props.cachedData.length === 0) return [];
  return props.cachedData.map(trip => ({
    ...trip,
    distanceKm: trip.distance ? (trip.distance).toFixed(1) : '0.0',
  }));
});


// Group trips by date, but only for the 'card' (timeline) layout
const groupedTrips = computed(() => {
  if (props.layout !== 'card') return [];
  
  const groups = new Map();
  processedTrips.value.forEach(trip => {
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

const toggleTripOnMap = (tripId) => {
  tripsStore.toggleTripDetails(props.vehicleId, tripId);
};
</script>

<template>
  <div>
    <!-- No Data State -->
    <div v-if="!processedTrips || processedTrips.length === 0" class="text-gray-500 text-sm text-center py-8">
      No recent trips found.
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- == Layout 1: Card / Timeline (For VehicleDetailPanel) == -->
      <div v-if="layout === 'card'" class="card p-4 rounded-md">
        <h4 class="font-medium uppercase text-md mb-4 text-gray-900">TRIPS</h4>
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
      
      <!-- == Layout 2: Table (For ResourceDetailModal) == -->
      <div v-else-if="layout === 'table'" class="bg-white rounded-lg p-4">
        <h3 class="font-medium uppercase text-gray-900 mb-4">Trip History</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="text-light">
              <tr>
                <th scope="col" class="p-3 text-left text-xs text-gray-500 ">Date</th>
                <th scope="col" class="p-3 text-left text-xs text-gray-500 ">Time (Start / End)</th>
                <th scope="col" class="p-3 text-left text-xs text-gray-500 ">Driver</th>
                <th scope="col" class="p-3 text-center text-xs text-gray-500 ">Distance</th>
                <th scope="col" class="p-3 text-center text-xs text-gray-500 ">Duration</th>
                <th scope="col" class="p-3 text-center text-xs text-gray-500 ">Driving</th>
                <th scope="col" class="p-3 text-center text-xs text-gray-500 ">Idle</th>
                <th scope="col" class="p-3 text-center text-xs text-gray-500 ">FuelUsage</th>
                <th scope="col" class="p-3 text-center text-xs text-gray-500 ">has PDC</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="trip in processedTrips" 
                :key="trip.id" 
                class="hover:bg-gray-200 cursor-pointer">
                <td class="p-3 whitespace-nowrap text-gray-900">{{ trip.date}}</td>
                <td class="p-3 whitespace-nowrap font-medium text-gray-900">
                  {{ trip.startTime }}<i class="fa-light fa-arrow-right text-primary-500 mx-2"></i>{{ trip.endTime }}
                </td>
                <td class="p-3 whitespace-nowrap text-gray-900">{{ trip.driverName }}</td>
                <td class="p-3 whitespace-nowrap text-right text-gray-900">{{ trip.distanceKm }} km</td>
                <td class="p-3 whitespace-nowrap text-right text-gray-900">{{ trip.duration }}</td>
                <td class="p-3 whitespace-nowrap text-right text-gray-900">{{ trip.driveTime }}</td>
                <td class="p-3 whitespace-nowrap text-right text-gray-900">{{ trip.idleTime }}</td>
                <td class="p-3 whitespace-nowrap text-right text-gray-900">{{ trip.fuelUsage }}</td>
                <td class="p-3 whitespace-nowrap text-center text-gray-900">{{ trip.has_PDC }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles for Card/Timeline Layout */
.timeline-group {
  position: relative;
  padding-left: 20px;
}
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
  gap: 0.5rem;
}
.trip-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background-color:transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.trip-row:hover {
  background-color: var(--color-secondary-300);
}
.trip-time {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 600;
}
.tacho-id {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #6b7280;
}
i {
  width: 16px;
  text-align: center;
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
