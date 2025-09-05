import express from 'express';
import db from '../models/index.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { QueryTypes } from 'sequelize';

const router = express.Router();
const { Settings, sequelize } = db;

router.get('/', isAuthenticated, async (req, res) => {
  const { customerId } = req.user;
  
  try {
    // 1. Define the promises for your database queries
    const settingsPromise = Settings.findOne({
      where: { customer_id: customerId }
    });

    const groupsQuery = `
      SELECT 
        c.id,
        CONCAT(IF(c.id = :customerId, '*', ''), ' ', c.name) AS name
      FROM 
        customer_customer cc  
        LEFT JOIN customers c ON c.id = cc.relatedCustomerId 
      WHERE 
        cc.custId = :customerId AND cc.active = 1 AND CURDATE() BETWEEN cc.created AND cc.validUntil
      ORDER BY 
        IF(c.id = :customerId, 0, 1), name ASC
    `;
    const groupsPromise = sequelize.query(groupsQuery, {
      replacements: { customerId },
      type: QueryTypes.SELECT
    });

    // 2. Await the results. This is where 'settings' is declared and initialized.
    const [settings, groups] = await Promise.all([settingsPromise, groupsPromise]);

    // 3. Now it's safe to check if 'settings' exists.
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found for this customer.' });
    }

    // 4. Finally, send the response with the initialized variables.
    res.json({ settings, groups });

  } catch (error) {
    console.error('Error fetching settings and groups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;