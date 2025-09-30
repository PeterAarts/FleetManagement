// ============================================
// FILE: routes/auth.js (UPDATE EXISTING)
// ============================================
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

import { sessionAuth } from '../middleware/sessionAuth.js';
import { getActivityStatus } from '../middleware/activityTracker.js';

const router = express.Router();
const { User } = db;

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    console.log('Login request received for email:', email);
    const user = await User.unscoped().findOne({ where: { email: email } });
    console.log('Login attempt for user:', user.username ? user.username : 'Unknown');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // >>> NEW: Create session <<<
    req.session.userId = user.id;
    req.session.customerId = user.cust_id;
    req.session.username = user.username;
    req.session.selectedCustomerId = user.cust_id; // Default to user's own customer
    req.session.loginTime = new Date();

    // Generate JWT token (keep for backward compatibility)
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// >>> NEW: Add logout endpoint <<<
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
  // The 'trackActivity' middleware (applied in server.js) automatically
  // updates the user's last activity time. We just need to send a
  // success response to acknowledge the ping.
  res.status(200).json({ message: 'Activity acknowledged' });
});
export default router;