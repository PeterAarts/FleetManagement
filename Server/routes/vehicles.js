import express from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { validateGroupAccess } from '../middleware/validateGroupAccess.js';
import { VehicleService } from '../services/vehicleService.js';

const router = express.Router();

router.get('/', isAuthenticated, validateGroupAccess, async (req, res) => {
  try {
    // Collect all query options to pass to the service
    const options = {
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      since: req.query.since, 
    };

    const result = await VehicleService.getProcessedVehicles(
      req.user.customerId,
      req.query.group,
      options // Pass the updated options object to the service
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get the VIN from the URL parameter
    const vehicle = await VehicleService.getSingleVehicleDetails(id);
    
    if (vehicle) {
      res.status(200).json(vehicle);
    } else {
      res.status(404).json({ message: `Vehicle with ID ${id} not found.` });
    }
  } catch (error) {
    console.error(`Error fetching details for ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
export default router;