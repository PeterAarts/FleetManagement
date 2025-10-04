import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { VehicleService } from '../services/vehicleService.js';
import { TrailerService } from '../services/trailerService.js';

const router = express.Router();

router.get('/', sessionAuth, async (req, res) => {
  try {
    // Collect query options (removed group from here)
    const options = {
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      since: req.query.since, 
    };
    
    // Use selectedCustomerId from session (set by sessionAuth middleware)
    const customerId = req.user.selectedCustomerId;
    
    const result = await VehicleService.getProcessedVehicles(
      customerId,
      options
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await VehicleService.getSingleVehicleDetails(
      id, 
      req.user.selectedCustomerId
    );
    
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

router.get('/:id/tpms', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tpmsData = await VehicleService.getVehicleTPMSData(
      id, 
      req.user.selectedCustomerId
    );
    
    if (tpmsData) {
      res.json(tpmsData);
    } else {
      res.status(404).json({ message: 'TPMS data not found for this vehicle' });
    }
  } catch (error) {
    console.error(`Error fetching TPMS data for vehicle ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/driver', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const driverData = await VehicleService.getVehicleDriverData(
      id, 
      req.user.selectedCustomerId
    );
    
    if (driverData) {
      res.json(driverData);
    } else {
      res.status(404).json({ message: 'Driver data not found for this vehicle' });
    }
  } catch (error) {
    console.error(`Error fetching driver data for vehicle ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/trips', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.selectedCustomerId;
    const options = {
      limit: req.query.limit,
    };

    const tripsData = await VehicleService.getVehicleTripsData(id, customerId, options);
    
    res.json(tripsData);

  } catch (error) {
    console.error(`Error fetching trips data for vehicle ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/:vehicleId/trips/:tripId', sessionAuth, async (req, res) => {
  try {
    // Correctly get BOTH vehicleId and tripId from the request parameters
    const { vehicleId, tripId } = req.params;
    const customerId = req.user.selectedCustomerId;

    // Call the service method with the correct 3 parameters: vehicleId, tripId, customerId
    const tripDetails = await VehicleService.getSingleTripDetails(
      vehicleId,
      tripId,
      customerId
    );
    
    // Check if the service found the trip
    if (tripDetails) {
      res.json(tripDetails);
    } else {
      res.status(404).json({ message: 'Trip not found or you do not have access to it.' });
    }

  } catch (error) {
    // Updated error log for better debugging
    console.error(`Error fetching details for vehicle ${req.params.vehicleId}, trip ${req.params.tripId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/trailer', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.selectedCustomerId;
    
    const trailerData = await TrailerService.getTrailerByVehicleId(id, customerId);
    
    if (trailerData) {
      res.json(trailerData);
    } else {
      res.status(404).json({ message: 'No trailer found attached to this vehicle' });
    }
  } catch (error) {
    console.error(`Error fetching trailer data for vehicle ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/damage', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.selectedCustomerId;
    
    // Call the new service method to get damage data
    const damageData = await VehicleService.getVehicleDamageData(id, customerId);
    
    // The service returns an array, which could be empty if there are no damages.
    // This is a valid response, so we send it directly.
    res.json(damageData);

  } catch (error) {
    console.error(`Error fetching damage data for vehicle ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/geofence/events', sessionAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.selectedCustomerId;
    
    const geofenceData = await VehicleService.getVehicleGeofenceData(id, customerId);
    
    res.json(geofenceData);

  } catch (error) {
    console.error(`Error fetching geofence data for vehicle ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/:id/geofence/:eventId', sessionAuth, async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const customerId = req.user.selectedCustomerId;
    
    const eventDetails = await VehicleService.getGeofenceEventDetails(
      id, 
      eventId, 
      customerId
    );
    
    if (eventDetails) {
      res.json(eventDetails);
    } else {
      res.status(404).json({ message: 'Geofence event not found or access denied' });
    }

  } catch (error) {
    console.error(`Error fetching geofence event ${req.params.eventId}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;