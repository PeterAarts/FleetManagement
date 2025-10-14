// ============================================
// FILE: middleware/sessionAuth.js (SECURED)
// ============================================
import jwt from 'jsonwebtoken';

export const sessionAuth = async (req, res, next) => {
  // CRITICAL: API endpoints MUST have Authorization header
  // Even if there's a valid session, we require explicit JWT for API access
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check if there's a valid session (for error message purposes)
    if (req.session && req.session.userId) {
      return res.status(401).json({ 
        message: 'API access requires Bearer token. Direct browser access is not allowed.'
      });
    }
    return res.status(401).json({ 
      message: 'Authentication required. No token provided.' 
    });
  }
  // Validate JWT token
  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Create/update session from JWT for activity tracking
    if (!req.session.userId) {
      req.session.userId = payload.userId;
      req.session.customerId = payload.customerId;
      req.session.username = payload.username;
    }
    
    // Set selectedCustomerId if not already set
    if (!req.session.selectedCustomerId) {
      req.session.selectedCustomerId = payload.customerId;
    }
    
    // Update last activity timestamp in session
    req.session.lastActivityTime = Date.now();
    
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      customerId: payload.customerId,
      username: payload.username,
      selectedCustomerId: req.session.selectedCustomerId,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Invalid or expired token.',
      error: error.message 
    });
  }
};