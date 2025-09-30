// services/activityMonitor.js (FINAL)
import apiClient from '@/tools/apiClient';
import { useAuthStore } from '@/stores/authStore';

class ActivityMonitor {
  constructor() {
    this.checkInterval = null;
    this.isWarningShown = false;
    
    // Bind methods
    this.updateActivity = this.updateActivity.bind(this);
    this.handleUserActivity = this.handleUserActivity.bind(this);
  }

  init() {
    this.lastActivity = Date.now();
    this.attachActivityListeners();
    this.startMonitoring();
    console.log(`Activity monitoring started.`);
  }

  attachActivityListeners() {
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus', 'blur'];
    activities.forEach(event => document.addEventListener(event, this.handleUserActivity, true));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.updateActivity();
    });
  }

  removeActivityListeners() {
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus', 'blur'];
    activities.forEach(event => document.removeEventListener(event, this.handleUserActivity, true));
  }

  handleUserActivity() {
    // Throttle activity updates to avoid excessive calls
    const now = Date.now();
    if (now - (this.lastActivity || 0) > 60000) { // Update max once per minute
      this.updateActivity();
    }
    this.isWarningShown = false;
  }

  updateActivity() {
    this.lastActivity = Date.now();
    try {
      apiClient.post('/auth/activity-ping', { timestamp: this.lastActivity });
    } catch (error) {
      // Silently fail
    }
  }

  startMonitoring() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    // Check activity every 30 seconds
    this.checkInterval = setInterval(() => this.checkInactivity(), 30000);
  }

  async checkInactivity() {
    try {
      const response = await apiClient.get('/auth/activity-status');
      const { timeUntilTimeout } = response.data;
      
      // RESTORED: Explicitly check if the timer has reached zero
      if (timeUntilTimeout <= 0) {
        this.performInactivityLogout();
        return; // Stop further checks
      }
      
      const warningThreshold = 5 * 60 * 1000; // 5 minutes
      
      if (timeUntilTimeout <= warningThreshold && !this.isWarningShown) {
        this.showInactivityWarning(timeUntilTimeout);
      }
      
    } catch (error) {
      // This will catch 401s if the token expires for other reasons
      console.warn('Activity check failed. Stopping monitor.', error);
      this.cleanup();
    }
  }

  showInactivityWarning(timeRemaining) {
    if (this.isWarningShown) return;
    this.isWarningShown = true;
    const minutes = Math.ceil(timeRemaining / (60 * 1000));

    // --- REPLACED confirm() WITH Notiflix.Confirm.show() ---
    Confirm.show(
      'Session Expiring Soon',
      `Your session will expire in about ${minutes} minute(s) due to inactivity. Do you want to extend it?`,
      'Yes, Keep Me Logged In',
      'No, Log Out',
      // This function is called when the user clicks a button
      () => {
        // User clicked "Yes"
        this.updateActivity();
        this.isWarningShown = false;
      },
      () => {
        // User clicked "No"
        this.performInactivityLogout();
      },
    );
  }

  // RESTORED: The function that performs the logout action
  performInactivityLogout() {
    console.warn('Session expired due to inactivity. Triggering logout.');
    this.cleanup();
    
    // Call the central logout action from the auth store.
    // This will handle resetting state and redirecting the user.
    const authStore = useAuthStore();
    authStore.logout('expired');
  }

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isWarningShown = false;
    this.removeActivityListeners();
    console.log('Activity monitoring stopped.');
  }
}

// Create singleton instance
export const activityMonitor = new ActivityMonitor();
export default activityMonitor;