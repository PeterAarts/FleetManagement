// routes/driver.js
import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { DriverService } from '../services/driverService.js';

const router = express.Router();

/**
 * Get driver details with drive time calculations
 * GET /api/driver/:id
 */
router.get('/:id', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.selectedCustomerId;
    
    if (!id) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }
    
    const driverDetails = await DriverService.getDriverDetails(id, customerId);
    
    if (!driverDetails) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driverDetails);
    
  } catch (error) {
    console.error('Error fetching driver details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get multiple drivers' basic info
 * POST /api/driver/batch
 */
router.post('/batch', sessionAuth, async (req, res) => {
  try {
    const { driverIds } = req.body;
    const customerId = req.user.selectedCustomerId;
    
    if (!driverIds || !Array.isArray(driverIds)) {
      return res.status(400).json({ message: 'Driver IDs array is required' });
    }
    
    const drivers = await DriverService.getDriversBasicInfo(driverIds, customerId);
    
    res.json(drivers);
    
  } catch (error) {
    console.error('Error fetching drivers info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;