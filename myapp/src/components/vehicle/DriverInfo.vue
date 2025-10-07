<template>
  <div class="driver-info-wrapper mb-4">
    <!-- Loading State -->
    <div v-if="loading" class="driver-info-card">
      <div class="flex justify-center items-center h-32">
        <i class="fa-light fa-spinner-third fa-spin text-primary text-2xl"></i>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="driver-info-card">
      <div class="text-red-500 text-center p-4">
        <i class="fa-light fa-exclamation-circle text-2xl mb-2"></i>
        <p>{{ error }}</p>
      </div>
    </div>
    
    <!-- Driver Data -->
    <div v-else-if="driverData" class="driver-info-card">
      <div class="driver-header font-medium uppercase text-gray-900">{{ driverPosition }}</div>
      
      <div class="driver-details mb-4">
        <div class="driver-name">
          <i class="fa-light fa-user text-primary-500"></i>
          <span>{{ driverData.fullName }}</span>
        </div>
        <div class="driver-tacho">
          <i class="fa-light fa-phone"></i>
          <span>{{ driverData.mobile }}</span>
        </div>
      </div>
      
      <!-- Drive Time Progress Bars -->
      <div class="flex items-center justify-between mb-4">
        <div class="time-bar">
          <label>{{ formatTime(driverData.driveTodaySeconds) }}</label>
          <div class="progress-container">
            <div 
              class="progress-bar today"
              :style="{ width: getTodayProgress() + '%' }"
              :class="{ 'warning': getTodayProgress() < 10, 'danger': getTodayProgress() <2 }"
            ></div>
          </div>
          <span class="time-label">today</span>
        </div>
        
        <div class="time-bar ">
          <label>{{ formatTime(driverData.driveWeeklySeconds) }}</label>
          <div class="progress-container">
            <div 
              class="progress-bar weekly"
              :style="{ width: getWeeklyProgress() + '%' }"
              :class="{ 'warning': getWeeklyProgress() <10, 'danger': getWeeklyProgress() <2}"
            ></div>
          </div>
          <span class="time-label">weekly</span>
        </div>
        
        <div class="time-bar">
          <label>{{ formatTime(driverData.driveBiWeeklySeconds) }}</label>
          <div class="progress-container">
            <div 
              class="progress-bar biweekly"
              :style="{ width: getBiWeeklyProgress() + '%' }"
              :class="{ 'warning': getBiWeeklyProgress() < 10, 'danger': getBiWeeklyProgress() <2 }"
            ></div>
          </div>
          <span class="time-label">bi-weekly</span>
        </div>
      </div>
      
      <!-- Usage Indicators -->
      <div class="usage-indicators  ">
        <div class="indicator" :class="{ 'limit-reached': driverData.extendedHoursUsed >= driverData.extendedHoursAvailable }">
          <span>extended hour</span>
          <div class="dots">
            <span 
              v-for="i in driverData.extendedHoursAvailable || 2" 
              :key="'ext-' + i"
              class="dot"
              :class="{ 'used': i <= driverData.extendedHoursUsed }"
            ></span>
          </div>
        </div>
        
        <div class="indicator " :class="{ 'limit-reached': driverData.shortRestsUsed >= driverData.shortRestsAvailable }">
          <span>short rest</span>
          <div class="dots">
            <span 
              v-for="i in driverData.shortRestsAvailable || 3" 
              :key="'rest-' + i"
              class="dot"
              :class="{ 'used': i <= driverData.shortRestsUsed }"
            ></span>
          </div>
        </div>
        
        <div class="indicator ">
          <span>working days</span>
          <div class="dots">
            <span 
              v-for="i in driverData.maxConsecutiveDays || 6" 
              :key="'days-' + i"
              class="dot"
              :class="{ 'used': i <= driverData.workingDays }"
            ></span>
          </div>
        </div>
      </div>
      
      <!-- Infringement Alert -->
      <div v-if="driverData.hasInfringements" class="infringement-alert">
        <i class="fa-light fa-triangle-exclamation"></i>
        <span>{{ driverData.infringements }} infringement(s) detected</span>
      </div>
    </div>
    
    <!-- No Data -->
    <div v-else class="driver-info-card">
      <div class="no-driver">
        <i class="fa-light fa-user-slash text-3xl text-gray-300 mb-2"></i>
        <p>No driver information available</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import apiClient from '@/tools/apiClient';

export default {
  name: 'DriverInfo',
  props: {
    vehicleId: {
      type: [String, Number],
      required: false
    },
    driverId: {
      type: [String, Number],
      required: false
    },
    cachedData: {
      type: Object,
      default: null
    },
    driverPosition: {
      type: String,
      default: 'DRIVER 1'
    }
  },
  setup(props) {
    const driverData = ref(null);
    const loading = ref(false);
    const error = ref(null);
    
    const fetchDriverData = async (driverId) => {
      if (!driverId) {
        driverData.value = null;
        return;
      }
      
      // Use cached data if available
      if (props.cachedData) {
        driverData.value = props.cachedData;
        return;
      }
      
      loading.value = true;
      error.value = null;
      
      try {
        // Use apiClient for consistency
        const response = await apiClient.get(`/driver/${driverId}`);
        driverData.value = response.data;
      } catch (err) {
        console.error('Error fetching driver data:', err);
        error.value = err.response?.data?.message || 'Failed to fetch driver data';
        driverData.value = null;
      } finally {
        loading.value = false;
      }
    };
    
    const formatTime = (seconds) => {
      if (!seconds || seconds < 0) return '00:00';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}:${String(minutes).padStart(2, '0')}`;
    };
    
    const getTodayProgress = () => {
      if (!driverData.value) return 0;
      const progress = (driverData.value.driveTodaySeconds / driverData.value.maxDriveTodaySeconds) * 100;
      return Math.min(100, Math.max(0, progress));
    };
    
    const getWeeklyProgress = () => {
      if (!driverData.value) return 0;
      const progress = (driverData.value.driveWeeklySeconds / driverData.value.maxDriveWeeklySeconds) * 100;
      return Math.min(100, Math.max(0, progress));
    };
    
    const getBiWeeklyProgress = () => {
      if (!driverData.value) return 0;
      const progress = (driverData.value.driveBiWeeklySeconds / driverData.value.maxDriveBiWeeklySeconds) * 100;
      return Math.min(100, Math.max(0, progress));
    };
    
    // Watch for driver ID changes
    watch(() => props.driverId, (newId) => {
      if (newId && !props.cachedData) {
        fetchDriverData(newId);
      }
    });
    
    // Watch for cached data changes
    watch(() => props.cachedData, (newData) => {
      if (newData) {
        driverData.value = newData;
      }
    });
    
    // Initial load
    onMounted(() => {
      if (props.cachedData) {
        driverData.value = props.cachedData;
      } else if (props.driverId) {
        fetchDriverData(props.driverId);
      }
    });
    
    return {
      driverData,
      loading,
      error,
      formatTime,
      getTodayProgress,
      getWeeklyProgress,
      getBiWeeklyProgress
    };
  }
};
</script>

<style scoped>
.driver-info-card {
  background: var(--card);
  border-radius: var(--radius-md);
  padding: 20px;
}

.driver-header {
  margin: 0 0 15px 0;

  text-transform: uppercase;
}

.driver-details > div {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

}

.driver-details i {
  margin-right: 10px;
  color: #999;
}


.time-bar label {
  font-weight: 600;
  color: #333;
}

.progress-container {
  height: 6px;
  background:var(--color-secondary-100);
  border-radius: 4px;
  margin: 5px 0;
  overflow: hidden;
  width: 100px;
}

.progress-bar {
  height: 100%;
  background: var(--color-primary-500);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-bar.warning {
  background: #ffc107;
}

.progress-bar.danger {
  background: #dc3545;
}

.time-label {
  font-size: 12px;
  color: #999;
}

.usage-indicators {
 
}

.indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.indicator span {
  font-size: 13px;
  color: #666;
}

.dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-secondary-100);
  transition: background 0.3s;
}

.dot.used {
  background: var(--color-secondary-100);
}

.indicator.limit-reached .dot.used {
  background: var(--color-danger-500);
}

.infringement-alert {
  margin-top: 1rem;
  padding: 10px;
  background: #f8d7da;
  color: var(--color-danger-800);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.infringement-alert i {
  margin-right: 10px;
}

.no-driver {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style>