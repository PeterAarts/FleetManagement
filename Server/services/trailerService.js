// services/trailerService.js - Simplified version
import db from '../models/index.js';

export class TrailerService {
  static async getTrailerById(trailerId, customerId) {
    try {
      // Optimized query - moved damage count to a separate query for better performance
      const query = `
        SELECT 
          t.id as TrailerId, 
          t.*, 
          mr.first_registration_date,
          mr.next_service_date,
          mr.country,
          v.customerVehicleName,
          v.last_Latitude as vehicle_last_Latitude,
          v.last_Longitude as vehicle_last_Longitude
        FROM 
          trailers t 
          LEFT JOIN mot_register mr ON mr.trailer = t.vin
          LEFT JOIN vehicles v ON v.vin = t.vehicleVIN
        WHERE 
          t.id = :trailerId 
          AND t.trailerActive = 1
          AND t.cust_id = :customerId
      `;

      const results = await db.sequelize.query(query, {
        replacements: { trailerId, customerId: customerId.toString() },
        type: db.sequelize.QueryTypes.SELECT
      });

      if (results.length === 0) return null;

      const trailer = results[0];
      
      // Get damage count in a separate, optimized query
      const damageQuery = `
        SELECT count(*) as DamageCount 
        FROM pdc_damage 
        WHERE trailer = :vin AND repairStatus = 0
      `;
      
      const damageResults = await db.sequelize.query(damageQuery, {
        replacements: { vin: trailer.vin },
        type: db.sequelize.QueryTypes.SELECT
      });
      
      trailer.DamageCount = damageResults[0]?.DamageCount || 0;
      
      // Apply the same processing as your PHP script
      const StatusArray = {
        alert: false,
        driving: false,
        stopped: false,
        paused: false
      };

      if (trailer.currentSpeed > 0) {
        StatusArray.driving = true;
      } else {
        if (trailer.tripActive) {
          StatusArray.paused = true;
        } else {
          StatusArray.stopped = true;
        }
      }

      trailer.status = StatusArray;
      
      // Parse JSON fields safely
      try {
        trailer.doorData = trailer.currentDoorStatus ? JSON.parse(trailer.currentDoorStatus) : null;
        trailer.currentCoolingStatus = trailer.currentCoolingStatus ? JSON.parse(trailer.currentCoolingStatus) : null;
        trailer.currentTemperatureStatus = trailer.currentTemperatureStatus ? JSON.parse(trailer.currentTemperatureStatus) : null;
        trailer.telematicsStatus = trailer.telematicsStatus ? JSON.parse(trailer.telematicsStatus) : null;
      } catch (error) {
        console.error('Error parsing JSON fields:', error);
      }

      // Clean up like PHP version
      delete trailer.currentDoorStatus;
      delete trailer.tpmsStatus;

      return trailer;
    } catch (error) {
      console.error('Error fetching trailer:', error);
      throw error;
    }
  }

  static async getTrailerByVehicleId(vehicleId, customerId) {
    try {
      const query = `
        SELECT 
          t.id as TrailerId, 
          t.*, 
          mr.first_registration_date,
          mr.next_service_date,
          mr.country,
          v.customerVehicleName,
          v.last_Latitude as vehicle_last_Latitude,
          v.last_Longitude as vehicle_last_Longitude,
          (SELECT count(trailer) FROM pdc_damage WHERE pdc_damage.trailer = t.vin AND pdc_damage.repairStatus = 0) AS DamageCount 
        FROM 
          trailers t 
          LEFT JOIN mot_register mr ON mr.trailer=t.vin
          LEFT JOIN customer_trailer ct ON ct.trailervin = t.vin 
          LEFT JOIN customer_customer cc ON cc.relatedCustomerId = ct.custId 
          LEFT JOIN vehicles v on v.vin = t.vehicleVIN
        WHERE 
          v.id = :vehicleId 
          AND t.trailerActive=true 
          AND cc.custId = :customerId
      `;

      return this.processQueryResults(query, { vehicleId, customerId });
    } catch (error) {
      console.error('Error fetching trailer by vehicle:', error);
      throw error;
    }
  }

  static async processQueryResults(query, replacements) {
    const results = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    if (results.length === 0) return null;

    return this.processTrailerData(results[0]);
  }

  static processTrailerData(trailer) {
    const StatusArray = {
      alert: false,
      driving: false,
      stopped: false,
      paused: false
    };

    if (trailer.currentSpeed > 0) {
      StatusArray.driving = true;
    } else {
      if (trailer.tripActive) {
        StatusArray.paused = true;
      } else {
        StatusArray.stopped = true;
      }
    }

    trailer.status = StatusArray;
    
    // Parse JSON fields safely
    try {
      trailer.doorData = trailer.currentDoorStatus ? JSON.parse(trailer.currentDoorStatus) : null;
      trailer.currentCoolingStatus = trailer.currentCoolingStatus ? JSON.parse(trailer.currentCoolingStatus) : null;
      trailer.currentTemperatureStatus = trailer.currentTemperatureStatus ? JSON.parse(trailer.currentTemperatureStatus) : null;
      trailer.telematicsStatus = trailer.telematicsStatus ? JSON.parse(trailer.telematicsStatus) : null;
    } catch (error) {
      console.error('Error parsing JSON fields:', error);
    }

    // Clean up
    delete trailer.currentDoorStatus;
    delete trailer.tpmsStatus;

    return trailer;
  }
}