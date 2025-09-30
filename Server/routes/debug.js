// routes/debug.js (or add to existing auth.js)
import express from 'express';
import jwt from 'jsonwebtoken';
import { sessionAuth } from '../middleware/sessionAuth.js';

const router = express.Router();

// Debug route - only available in development
if (process.env.NODE_ENV === 'development') {
  router.get('/token-info', sessionAuth, (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.json({
          error: 'No token provided',
          hasToken: false
        });
      }

      // Decode without verification to get payload info
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        return res.json({
          error: 'Invalid token format',
          hasToken: true,
          isValid: false
        });
      }

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      const isExpired = timeUntilExpiry <= 0;

      // Try to verify the token
      let isValidSignature = false;
      let verificationError = null;
      
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        isValidSignature = true;
      } catch (error) {
        verificationError = error.message;
      }

      res.json({
        hasToken: true,
        isValid: isValidSignature,
        isExpired,
        verificationError,
        tokenInfo: {
          userId: decoded.userId,
          customerId: decoded.customerId,
          selectedCustomerId: decoded.selectedCustomerId,
          issuedAt: new Date(decoded.iat * 1000).toISOString(),
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          timeUntilExpiry: {
            seconds: timeUntilExpiry,
            minutes: Math.floor(timeUntilExpiry / 60),
            hours: Math.floor(timeUntilExpiry / 3600),
            formatted: formatDuration(timeUntilExpiry)
          }
        },
        sessionInfo: {
          hasSession: !!req.session,
          sessionUserId: req.session?.userId,
          sessionCustomerId: req.session?.selectedCustomerId
        },
        requestInfo: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to analyze token',
        message: error.message
      });
    }
  });

  // Helper route to test token expiration
  router.get('/test-expired-token', (req, res) => {
    // Create a token that expires in 5 seconds for testing
    const testPayload = {
      userId: 999,
      customerId: 999,
      selectedCustomerId: 999,
      exp: Math.floor(Date.now() / 1000) + 5 // Expires in 5 seconds
    };

    const testToken = jwt.sign(testPayload, process.env.JWT_SECRET);
    
    res.json({
      message: 'Test token created (expires in 5 seconds)',
      token: testToken,
      expiresIn: '5 seconds',
      testInstructions: 'Use this token in your Authorization header and call /debug/token-info after 5 seconds'
    });
  });
}

// Helper function to format duration
function formatDuration(seconds) {
  if (seconds <= 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default router;