// ============================================
// FILE: middleware/activityTracker.js (UPDATED)
// ============================================
const userActivity = new Map();

export const trackActivity = (req, res, next) => {
  // Skip activity tracking for these specific endpoints
  if (
    req.path === '/api/auth/activity-status' ||
    req.headers['x-background-refresh'] === 'true'
  ) {
    return next();
  }

  // Track activity if user is authenticated
  if (req.user) {
    const activityInfo = {
      lastActivity: Date.now(),
      isDashboardUser: req.user.isDashboardUser || false
    };
    
    // Store in both Map and session for redundancy
    userActivity.set(req.user.id, activityInfo);
    
    // Also update session if it exists
    if (req.session) {
      req.session.lastActivityTime = Date.now();
    }
    
    res.set('X-Last-Activity', Date.now().toString());
  }
  
  next();
};

const getInactivityLimit = (userInfo) => {
  const defaultTimeout = parseInt(process.env.INACTIVITY_TIMEOUT_DEFAULT, 10) || 30;
  const dashboardTimeout = parseInt(process.env.INACTIVITY_TIMEOUT_DASHBOARD, 10) || 1440;
  
  const timeoutInMinutes = userInfo.isDashboardUser ? dashboardTimeout : defaultTimeout;
  return timeoutInMinutes * 60 * 1000; // Convert minutes to milliseconds
};

export const checkInactivity = (req, res, next) => {
  // Skip inactivity check for these specific endpoints
  if (
    req.path === '/api/auth/activity-status' ||
    req.headers['x-background-refresh'] === 'true'
  ) {
    return next();
  }

  if (!req.user) return next();
  
  const userInfo = userActivity.get(req.user.id);
  if (!userInfo) return next();
  
  const now = Date.now();
  const timeSinceLastActivity = now - userInfo.lastActivity;
  const inactivityLimit = getInactivityLimit(userInfo);
  
  if (timeSinceLastActivity > inactivityLimit) {
    // Clean up
    userActivity.delete(req.user.id);
    
    // Destroy session
    if (req.session) {
      req.session.destroy();
    }
    
    return res.status(401).json({
      error: 'INACTIVITY_TIMEOUT',
      message: 'Session expired due to inactivity'
    });
  }
  
  next();
};

export const getActivityStatus = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = req.user.id;
  const userInfo = userActivity.get(userId) || {
    lastActivity: Date.now(),
    isDashboardUser: req.user.isDashboardUser || false
  };
  
  const now = Date.now();
  const timeSinceLastActivity = now - userInfo.lastActivity;
  const inactivityLimit = getInactivityLimit(userInfo);
  
  res.json({
    lastActivity: userInfo.lastActivity,
    timeSinceLastActivity,
    timeUntilTimeout: Math.max(0, inactivityLimit - timeSinceLastActivity),
    isDashboardUser: userInfo.isDashboardUser,
    inactivityLimit
  });
};