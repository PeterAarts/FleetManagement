// ============================================
// FILE: routes/auth.js (SIMPLIFIED)
// ============================================
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

import { sessionAuth } from '../middleware/sessionAuth.js';
import { getActivityStatus } from '../middleware/activityTracker.js';
import { extractDomain, validateDomainAccess } from '../middleware/domainAccessValidator.js';

const router = express.Router();
const { User } = db;

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.unscoped().findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // === DOMAIN VALIDATION (using shared utility) ===
    const frontendDomain = extractDomain(req); 
    const validation = await validateDomainAccess(user.id, user.cust_id, frontendDomain);
    
    if (!validation.hasAccess) {
      return res.status(403).json({ 
        message: 'You do not have access to this application. Check if you are using the correct url',
        reason: validation.reason,
        domain: frontendDomain
      });
    }

    // === END DOMAIN VALIDATION ===

    // Create session
    req.session.userId = user.id;
    req.session.customerId = user.cust_id;
    req.session.username = user.username;
    req.session.selectedCustomerId = user.cust_id;
    req.session.loginTime = new Date();

    // Generate JWT token
    const payload = {
      userId: user.id,
      customerId: user.cust_id,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' });    
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        customerId: user.cust_id,
        selectedCustomerId: req.session.selectedCustomerId, 
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('rfms.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/activity-status', sessionAuth, getActivityStatus);
router.post('/activity-ping', sessionAuth, (req, res) => {
  res.status(200).json({ message: 'Activity acknowledged' });
});

export default router;