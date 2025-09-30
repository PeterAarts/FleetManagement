// ============================================
// FILE: middleware/sessionAuth.js (NEW FILE - Replaces isAuthenticated.js usage)
// ============================================
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

export const sessionAuth = async (req, res, next) => {
  // First check if user has a valid session
  if (req.session && req.session.userId && req.session.customerId) {
    // User is authenticated via session
    req.user = {
      id: req.session.userId,
      userId: req.session.userId, // Keep both for compatibility
      customerId: req.session.customerId,
      username: req.session.username,
      selectedCustomerId: req.session.selectedCustomerId || req.session.customerId,
    };
    return next();
  }

  // Fallback to JWT authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. check1' });
  }
  
  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Create/update session from JWT
    req.session.userId = payload.userId;
    req.session.customerId = payload.customerId;
    req.session.username = payload.username;
    
    // Set selectedCustomerId if not already set
    if (!req.session.selectedCustomerId) {
      req.session.selectedCustomerId = payload.customerId;
    }
    
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      customerId: payload.customerId,
      username: payload.username,
      selectedCustomerId: req.session.selectedCustomerId,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};