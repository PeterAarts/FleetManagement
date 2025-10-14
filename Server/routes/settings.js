// ============================================
// FILE: routes/settings.js (FIXED)
// ============================================
import express from 'express';
import db from '../models/index.js';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { QueryTypes } from 'sequelize';
import { extractDomain, validateDomainAccess } from '../middleware/domainAccessValidator.js';

const router = express.Router();
const { Settings, sequelize } = db;

/**
 * Get domain settings based on the actual frontend domain
 */
router.get('/domain', sessionAuth, async (req, res) => {
  try {
    const frontendDomain = extractDomain(req);
    const validation = await validateDomainAccess(req.user.userId, req.user.customerId, frontendDomain);
    
    if (!validation.hasAccess) {
      return res.status(403).json({ 
        message: 'You do not have access to this domain.',
        reason: validation.reason
      });
    }
    
    if (!validation.settings) {
      return res.status(404).json({ 
        message: 'No settings found for this domain.',
        domain: frontendDomain
      });
    }

    res.json({ settings: validation.settings });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get customer context - available groups and selected customer
 * Based on the DOMAIN's customer, not the user's customer
 */
router.get('/customer-context', sessionAuth, async (req, res) => {
  try {
    const frontendDomain = extractDomain(req);
    
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
    
    // Get selected customer from session, or default to domain customer
    let selectedCustomerId = req.session.selectedCustomerId || domainCustomerId;

    // Fetch the actual groups with the filter
    const groupsQuery = `
      SELECT 
        c.id,
        c.name,
        CONCAT(IF(c.id = :domainCustomerId, '* ', ''), c.name) AS displayName
      FROM 
        customer_customer cc  
        LEFT JOIN customers c ON c.id = cc.relatedCustomerId 
      WHERE 
        cc.custId = :domainCustomerId AND 
        cc.active = 1 AND 
        CURDATE() BETWEEN cc.created AND cc.validUntil
      ORDER BY 
        IF(c.id = :domainCustomerId, 0, 1), c.name ASC
    `;
    
    const groups = await sequelize.query(groupsQuery, {
      replacements: { domainCustomerId: domainCustomerId },
      type: QueryTypes.SELECT
    });

    // ============================================================
    // CRITICAL FIX: Update session with selectedCustomerId
    // ============================================================
    req.session.selectedCustomerId = parseInt(selectedCustomerId, 10);
    // ============================================================

    res.json({ 
      groups: groups.map(g => ({ id: g.id, name: g.displayName })),
      selectedCustomerId: req.session.selectedCustomerId,
      domainCustomerId: domainCustomerId
    });

  } catch (error) {
    console.error('Error fetching customer context:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;