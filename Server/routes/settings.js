import express from 'express';
import db from '../models/index.js';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { QueryTypes } from 'sequelize';

const router = express.Router();
const { Settings, sequelize } = db;

router.get('/', sessionAuth, async (req, res) => {
  // CORRECT: Get both the selected ID and the user's primary ID from the session
  const selectedCustomerId = req.user.selectedCustomerId;
  const primaryCustomerId = req.user.customerId; // This is the user's main account ID

  try {
    // The settings should be fetched for the currently SELECTED customer
    const settingsPromise = Settings.findOne({
      where: { customer_id: selectedCustomerId }
    });

    const groupsQuery = `
      SELECT 
        c.id,
        CONCAT(IF(c.id = :primaryCustomerId, '*', ''), ' ', c.name) AS name
      FROM 
        customer_customer cc  
        LEFT JOIN customers c ON c.id = cc.relatedCustomerId 
      WHERE 
        -- CORRECT: The list of available groups should always be based on the PRIMARY customer ID
        cc.custId = :primaryCustomerId AND 
        cc.active = 1 AND 
        CURDATE() BETWEEN cc.created AND cc.validUntil
      ORDER BY 
        IF(c.id = :primaryCustomerId, 0, 1), name ASC
    `;
    
    // The groups list should be fetched for the PRIMARY customer
    const groupsPromise = sequelize.query(groupsQuery, {
      replacements: { 
        primaryCustomerId: primaryCustomerId, // Use the correct ID here
        selectedCustomerId: selectedCustomerId 
      },
      type: QueryTypes.SELECT
    });

    const [settings, groups] = await Promise.all([settingsPromise, groupsPromise]);

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found for this customer.' });
    }

    res.json({ 
      settings, 
      groups,
      selectedCustomerId: selectedCustomerId
    });

  } catch (error) {
    console.error('Error fetching settings and groups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;