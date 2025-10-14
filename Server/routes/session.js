// ============================================
// FILE: routes/session.js (FIXED)
// ============================================
import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { extractDomain } from '../middleware/domainAccessValidator.js';
import db from '../models/index.js';
import { QueryTypes } from 'sequelize';

const router = express.Router();
const { Settings, sequelize } = db;

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
    // Extract domain to find which customer this domain belongs to
    const frontendDomain = extractDomain(req);
    // Find the domain's customer
    const domainSettings = await Settings.findOne({
      where: { domain: frontendDomain }
    });

    if (!domainSettings) {
      return res.status(404).json({ 
        message: 'Domain settings not found',
        domain: frontendDomain
      });
    }

    const domainCustomerId = domainSettings.customer_id;
    // Check if target customer is accessible from the DOMAIN's customer
    // (not the user's customer)
    const accessQuery = `
      SELECT c.id,c.name
      FROM 
        customer_customer cc  
        LEFT JOIN customers c ON c.id = cc.relatedCustomerId 
      WHERE 
        cc.custId = :domainCustomerId 
        AND cc.active = 1 
        AND CURDATE() BETWEEN cc.created AND cc.validUntil
        AND c.id = :targetCustomerId
    `;
    
    const accessResults = await sequelize.query(accessQuery, {
      replacements: { 
        domainCustomerId: domainCustomerId,
        targetCustomerId: customerId 
      },
      type: QueryTypes.SELECT
    });

    // Check if the target customer is accessible
    const canAccess = accessResults.length > 0;

    if (!canAccess) {
//      console.warn('Access denied to customer', customerId);
      return res.status(403).json({ 
        message: 'You do not have access to this customer',
        domainCustomerId: domainCustomerId,
        requestedCustomerId: customerId
      });
    }

    // Update session
    req.session.selectedCustomerId = parseInt(customerId);
    res.json({
      message: 'Selected customer updated',
      selectedCustomerId: req.session.selectedCustomerId,
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;