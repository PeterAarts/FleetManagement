<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-dialog modal-xl bg-secondary-100">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header">
          <div class="flex-grow-1">
            <div v-for="titleConfig in config.formTitle" :key="titleConfig.id" class="mb-1">
              <span :class="titleConfig.class">
                <i v-if="titleConfig.icon" :class="titleConfig.icon + ' me-2 text-sm'"></i>
                {{ data[titleConfig.field] }}
              </span>
            </div>
          </div>
          <button type="button" class="btn-close " @click="$emit('close')"></button>
        </div>

        <!-- Tabs Navigation -->
        <div v-if="config.formTabs && config.formTabs.length > 0" class="modal-tabs border-b">
          <!-- Edit Tab (always first) -->
          <button
            @click="activeTab = 'edit'"
            class="tab-button"
            :class="{ active: activeTab === 'edit' }"
            title="Edit Details"
          >
            <i class="fa-solid fa-info-circle"></i>
            <span class="hidden "></span>
          </button>
          
          <!-- Dynamic tabs from config -->
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            @click="switchTab(tab.id)"
            class="tab-button"
            :class="{ active: activeTab === tab.id }"
            :title="tab.tooltip"
          >
            <i :class="tab.icon"></i>
            <span class="hidden">{{ tab.label }}</span>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Edit Tab (Form) -->
          <div v-show="activeTab === 'edit'" class="p-4">
            <DynamicForm
              v-if="formBuild && formBuild.length > 0"
              :form-build="formBuild"
              :data="data"
              @save="$emit('save', $event)"
              @cancel="$emit('close')"
            />
            <div v-else-if="isLoading" class="text-center p-5">
              <div class="spinner-border"></div>
            </div>
            <div v-else class="alert alert-warning">
              No form configuration available
            </div>
          </div>

          <!-- Dynamic Tab Content -->
          <div v-show="activeTab !== 'edit'" class="p-4">
            <div v-if="tabLoading" class="flex justify-center items-center h-32">
              <i class="fa-light fa-spinner-third fa-spin text-primary text-2xl"></i>
            </div>
            
            <div v-else>
              <!-- Map tab IDs to components -->
              <component
                :is="getTabComponent(activeTab)"
                v-if="getTabComponent(activeTab)"
                :vehicle-id="data.id"
                :trailer-id="data.trailerId"
                :cached-data="tabData"
                v-bind="getTabProps(activeTab)"
                @update:trailer="handleTrailerUpdate"
              />
              
              <div v-else class="text-gray-500 text-center py-8">
                No content available for this tab.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import apiClient from '@/tools/apiClient';
import DynamicForm from './DynamicForm.vue';
import DriverInfo from '@/components/vehicle/DriverInfo.vue';
import TripsInfo from '@/components/vehicle/TripsInfo.vue';
import DamageInfo from '@/components/vehicle/DamageInfo.vue';
import TrailerInfo from '@/components/vehicle/TrailerInfo.vue';
import TPMSInfo from '@/components/vehicle/TPMSInfo.vue';
import GeofenceInfo from '@/components/vehicle/GeofenceInfo.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  data: { type: Object, required: true },
  formBuild: { type: Array, required: true },
  config: { type: Object, required: true },
  isLoading: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'save', 'update:resource']); // Added 'update:resource'

const activeTab = ref('edit');
const tabData = ref(null);
const tabLoading = ref(false);
const tabCache = ref(new Map());

// Map tab IDs from modalConfig to visibility rules
const tabVisibilityRules = {
  'tableVehicleActivity': () => props.data.drivers && props.data.drivers.length > 0,
  'tableVehicleTrips': () => true, // Always show
  'VehicleDamage': () => props.data.damageCount > 0,
  'tabVehicleTrailer': () => props.data.trailerId,
  'tabTPMS': () => props.data.tpmsVehicle || props.data.tpmsTrailer,
  'tableVehicleGeofences': () => props.data.geofence > 0,
  'Maintenance': () => true, // Always show if you have this component
};

// Filter tabs based on visibility rules
const availableTabs = computed(() => {
  if (!props.config.formTabs) return [];
  
  return props.config.formTabs.filter(tab => {
    const rule = tabVisibilityRules[tab.id];
    return rule ? rule() : true; // Show by default if no rule
  });
});

// Map tab IDs to Vue components
const tabComponentMap = {
  'tableVehicleActivity': DriverInfo,
  'tableVehicleTrips': TripsInfo,
  'VehicleDamage': DamageInfo,
  'tabVehicleTrailer': TrailerInfo,
  'tabTPMS': TPMSInfo,
  'tableVehicleGeofences': GeofenceInfo,
  // Add Maintenance component when you create it:
  // 'Maintenance': MaintenanceInfo,
};

// Get component for active tab
const getTabComponent = (tabId) => {
  return tabComponentMap[tabId] || null;
};

// Get additional props for specific components
const getTabProps = (tabId) => {
  const baseProps = {};
  
  if (tabId === 'tabVehicleTrailer')      {return {...baseProps,layout: 'form', mode: 'display' };}
  if (tabId === 'tableVehicleActivity')   {return {...baseProps,driverPosition: 'DRIVER'};}
  if (tabId === 'tabTPMS')                {return {...baseProps,layout: 'form', mode: 'display' };}
  return baseProps;
};

// This function captures the 'update:trailer' event from TrailerInfo
// and can be used to locally update tabData or signal a save action.
const handleTrailerUpdate = (updatedTrailerData) => {
  // In a real application, you would handle the state update or API call here.
  // For now, we update the local tabData so the view reacts immediately.
  tabData.value = updatedTrailerData._raw;

};


// Map tab IDs to API endpoints
const getTabEndpoint = (tabId) => {
  const endpointMap = {
    'tableVehicleActivity': () => {
      // Fetch all drivers
      return Promise.all(
        props.data.drivers.map(d => apiClient.get(`/driver/${d.driverId}`))
      ).then(responses => responses.map(r => r.data));
    },
    'tableVehicleTrips': () => apiClient.get(`/vehicles/${props.data.id}/trips?limit=10`).then(r => r.data),
    'VehicleDamage': () => apiClient.get(`/vehicles/${props.data.id}/damage`).then(r => r.data),
    'tabVehicleTrailer': () => apiClient.get(`/vehicles/${props.data.id}/trailer`).then(r => r.data),
    'tabTPMS': () => apiClient.get(`/vehicles/${props.data.id}/tpms`).then(r => r.data),
    'tableVehicleGeofences': () => apiClient.get(`/vehicles/${props.data.id}/geofence/events`).then(r => r.data),
  };
  
  return endpointMap[tabId] || null;
};

// Fetch data for tabs
const fetchTabData = async (tabId) => {
  const cacheKey = `${tabId}-${props.data.id}`;
  
  // Check cache first
  if (tabCache.value.has(cacheKey)) {
    return tabCache.value.get(cacheKey);
  }
  
  try {
    const fetchFn = getTabEndpoint(tabId);
    if (!fetchFn) {
      console.warn(`No endpoint defined for tab: ${tabId}`);
      return null;
    }
    
    const response = await fetchFn();
    
    // Cache the response
    tabCache.value.set(cacheKey, response);
    return response;
    
  } catch (error) {
    console.error(`Error fetching ${tabId} data:`, error);
    return null;
  }
};

// Switch tab and load data
const switchTab = async (tabId) => {
  if (activeTab.value === tabId) return;
  
  activeTab.value = tabId;
  
  // Check if data is cached
  const cacheKey = `${tabId}-${props.data.id}`;
  if (tabCache.value.has(cacheKey)) {
    tabData.value = tabCache.value.get(cacheKey);
    return;
  }
  
  // Load data
  tabLoading.value = true;
  try {
    tabData.value = await fetchTabData(tabId);
  } finally {
    tabLoading.value = false;
  }
};

// Reset when modal closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    activeTab.value = 'edit';
    tabData.value = null;
  }
});
</script>

<style >
.modal-backdrop             {position: fixed;top: 0;left: 0;width: 100%;height: 100%;background-color: rgba(0, 0, 0, 0.25);display: flex;justify-content: center;align-items: center;z-index: 1050;}
.modal-dialog               {max-width: 90%;max-height: 90vh;border-radius:var(--radius)}
.modal-content              {background: var(--color-secondary-100);border-radius: 8px;max-height: 90vh;display: flex;flex-direction: column;}
.modal-header               {padding: 1rem;background-color: var(--color-secondary-100);display: flex;align-items: center;justify-content: space-between;border-radius: 8px;}
.modal-tabs                 {display: flex;gap: 0;padding: 0 1rem;background: transparent;overflow-x: auto;border-bottom:1px solid var(--color-secondary-200)}
.tab-button                 {display: flex;align-items: center;margin-right:0.5rem;gap: 0.5rem;padding: 0.75rem 1rem;border: none;border-radius: 8px 8px 0 0; background: transparent;color: #6c757d;font-size: 0.875rem;cursor: pointer;border-bottom: 2px solid transparent;transition: all 0.2s;white-space: nowrap;}
.tab-button:hover           {background: var(--color-secondary-200);color:var(--color-gray-900);border-radius: 8px 8px 0 0; }
.tab-button.fa-light:hover  {font-weight:500}
.tab-button.active          {color: var(--color-primary-600, #0066cc);border-bottom-color: var(--color-primary-600, #0066cc);background: white;font-weight: 600;}
.modal-body                 {padding: 0;overflow-y: auto;flex: 1;box-shadow: none;}
.btn-close                  {background: transparent;border: none;font-size: 1.5rem;cursor: pointer;padding: 0; line-height: 0.5rem;    margin-bottom: auto;}
.btn-close:before           {content: '×';}
.modal-xl                   {width: 60%; height: 80vh;}

</style>
