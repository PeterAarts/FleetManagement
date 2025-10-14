// routes/trailers.js - Minimal version
import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { TrailerService } from '../services/trailerService.js';

const router = express.Router();

// GET /api/trailers/:id - Exact replica of PHP GetTrailerDetails.php?id=
router.get('/:id', sessionAuth, async (req, res) => {
  try {
    const trailerId = parseInt(req.params.id, 10);
    const customerId = req.user.selectedCustomerId;

    if (isNaN(trailerId)) {
      return res.status(400).json({ message: 'Trailer record not found or could not be deleted' });
    }

    const trailer = await TrailerService.getTrailerById(trailerId, customerId);

    if (!trailer) {
      return res.status(404).json({ message: 'Trailer record not found or could not be deleted' });
    }

    // Return as array to exactly match PHP output
    res.json([trailer]);
  } catch (error) {
    console.error(`Error fetching trailer ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/trailers/vehicle/:vehicleId - Exact replica of PHP GetTrailerDetails.php?vehicleId=
router.get('/vehicle/:vehicleId', sessionAuth, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId, 10);
    const customerId = req.user.selectedCustomerId;

    if (isNaN(vehicleId)) {
      return res.status(400).json({ message: 'Driver record not found or could not be deleted' });
    }

    const trailer = await TrailerService.getTrailerByVehicleId(vehicleId, customerId);

    if (!trailer) {
      return res.status(404).json({ message: 'Driver record not found or could not be deleted' });
    }

    res.json([trailer]);
  } catch (error) {
    console.error(`Error fetching trailer for vehicle ${req.params.vehicleId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;