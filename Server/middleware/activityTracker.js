const userActivity = new Map();

export const trackActivity = (req, res, next) => {
  if (
    req.path === '/api/auth/activity-status' ||
    req.headers['x-background-refresh'] === 'true'
  ) {
    return next();
  }
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  if (req.user) {
    userActivity.set(req.user.id, {
      lastActivity: Date.now(),
      isDashboardUser: req.user.isDashboardUser || false
    });
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
  // +++ ADDED: Exclude specific routes and background requests from inactivity checks +++
  if (
    req.path === '/api/auth/activity-status' ||
    req.headers['x-background-refresh'] === 'true'
  ) {
    return next();
  }
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  if (!req.user) return next();
  
  const userInfo = userActivity.get(req.user.id);
  if (!userInfo) return next();
  
  const now = Date.now();
  const timeSinceLastActivity = now - userInfo.lastActivity;
  const inactivityLimit = getInactivityLimit(userInfo);
  
  if (timeSinceLastActivity > inactivityLimit) {
    userActivity.delete(req.user.id);
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