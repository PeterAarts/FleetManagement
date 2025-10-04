import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { GeofenceService } from '../services/geofenceService.js';

const router = express.Router();

// GET /api/geofences/:id
router.get('/:id', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.selectedCustomerId;

    const geofenceDetails = await GeofenceService.getGeofenceDetails(id, customerId);

    if (geofenceDetails) {
      res.json(geofenceDetails);
    } else {
      res.status(404).json({ message: 'Geofence not found or you do not have access.' });
    }
  } catch (error) {
    console.error(`Error fetching details for geofence ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;