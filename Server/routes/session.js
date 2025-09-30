// ============================================
// FILE: routes/session.js (SIMPLIFIED VERSION)
// ============================================
import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import db from '../models/index.js';
import { QueryTypes } from 'sequelize';

const router = express.Router();
const { sequelize } = db;

// Get current session info
router.get('/info', sessionAuth, (req, res) => {
  res.json({
    userId: req.session.userId,
    username: req.session.username,
    customerId: req.session.customerId,
    selectedCustomerId: req.session.selectedCustomerId,
    loginTime: req.session.loginTime,
  });
});

// Update selected customer (for switching between related customers)
router.put('/customer', sessionAuth, async (req, res) => {
  const { customerId } = req.body;
  
  if (!customerId) {
    return res.status(400).json({ message: 'Customer ID is required' });
  }

  try {
    // Use a direct query to check if user has access to this customer
    // This matches the approach used in settings.js
    const accessQuery = `
      SELECT 
        c.id,
        c.name
      FROM 
        customer_customer cc  
        LEFT JOIN customers c ON c.id = cc.relatedCustomerId 
      WHERE 
        cc.custId = :userCustomerId 
        AND cc.active = 1 
        AND CURDATE() BETWEEN cc.created AND cc.validUntil
        AND c.id = :targetCustomerId
    `;
    
    const accessResults = await sequelize.query(accessQuery, {
      replacements: { 
        userCustomerId: req.session.customerId,
        targetCustomerId: customerId 
      },
      type: QueryTypes.SELECT
    });

    // Check if the user can access this customer
    const canAccess = (
      parseInt(customerId) === req.session.customerId || // User's own customer
      accessResults.length > 0 // Found in related customers
    );

    if (!canAccess) {
      return res.status(403).json({ 
        message: 'You do not have access to this customer' 
      });
    }

    // Update session
    req.session.selectedCustomerId = parseInt(customerId);
    
    res.json({
      message: 'Selected customer updated',
      selectedCustomerId: req.session.selectedCustomerId,
    });

  } catch (error) {
    console.error('Error updating selected customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;