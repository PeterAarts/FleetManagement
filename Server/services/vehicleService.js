// services/vehicleService.js
import db from '../models/index.js';
import { Op } from 'sequelize';

// We query the comprehensive view, so we only need the VehicleDetail model here
const { VehicleDetail, Customer, Settings } = db;

// --- Helper Functions ---

/**
 * Checks for and counts active 'RED' telltale warnings.
 * Mirroring the Check_telltale_warning PHP function.
 * @param {object} vehicle - A plain vehicle data object.
 * @returns {number} The count of active RED warnings.
 */
const checkTelltaleWarning = (vehicle, speedingThreshold = 90) => {
    let warningCount = 0;
    const redTelltales = ['TT_PAR_BRA', 'TT_FUE_LEV', 'TT_ENG_COO_TEM', 'TT_ENG_MIL_IND', 'TT_ENG_EMI_FAI', 'TT_ENG_OIL', 'TT_ADB_LEV'];
    redTelltales.forEach(tt => {
        // This assumes the view provides the telltale values as strings like 'RED'
        if (vehicle[tt] === 'RED' || vehicle[tt] === 'YELLOW') {
            warningCount++;
        }
    });
    return warningCount;
};

/**
 * Formats a time string (e.g., "08:30:00") into "8h 30m".
 * @param {string} timeString - The time string from the database.
 * @returns {string} The formatted duration.
 */
const formatTripDuration = (timeString) => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  return `${h}h ${m}m`;
};

/**
 * Calculates the complex status object for a vehicle.
 * Mirroring the post-query processing loop in the PHP script.
 * @param {object} vehicle - A plain vehicle data object.
 * @returns {object} The calculated status object.
 */
const calculateStatus = (vehicle, speedingThreshold = 90) => {
    const status = {};
    const now = new Date();

    if (vehicle.last_Latitude == 0) status.nolocation = true;
    if (vehicle.currentSpeed > speedingThreshold) status.overspeeding = true;
    if (vehicle.geofence) status.geofence = true;
    if (checkTelltaleWarning(vehicle) > 0) status.alert = true;

    if (vehicle.currentSpeed > 0) {
        status.driving = true;
        if (vehicle.lastActivity) {
            const lastActivity = new Date(vehicle.lastActivity);
            const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
            if (diffMinutes > 30) {
                status.delayed = true;
            }
        }
    } else {
        if (vehicle.tripActive) status.paused = true;
        else status.stopped = true;
    }
    return status;
};

/**
 * Fetches groups for the specified customer
 * @param {number} customerId - The customer ID
 * @returns {array} Array of group names
 */
const fetchGroups = async (customerId) => {
    try {
        // Fetch groups for the specific customer ID
        const groupsQuery = `
            SELECT g.name
            FROM groups g
            WHERE g.customerid = :customerId
            ORDER BY g.name
        `;
        
        const groups = await db.sequelize.query(groupsQuery, {
            replacements: { customerId },
            type: db.sequelize.QueryTypes.SELECT
        });

        // Return simple array of group names
        return groups.map(group => group.name);
    } catch (error) {
        console.error('Error fetching groups:', error);
        return [];
    }
};

/**
 * Fetches vehicle-group memberships with group names
 * @param {array} vehicleIds - Array of vehicle IDs
 * @returns {object} Mapping of vehicle ID to group name
 */
const fetchVehicleGroupMemberships = async (vehicleIds) => {
    try {
        if (!vehicleIds || vehicleIds.length === 0) return {};

        const membershipQuery = `
            SELECT gv.vehicleid, g.name as groupName
            FROM groupvehicle gv
            JOIN groups g ON gv.groupid = g.id
            WHERE gv.vehicleid IN (:vehicleIds)
        `;
        
        const memberships = await db.sequelize.query(membershipQuery, {
            replacements: { vehicleIds },
            type: db.sequelize.QueryTypes.SELECT
        });

        // Transform to object with vehicle ID as key and group name as value
        const membershipMap = {};
        memberships.forEach(membership => {
            membershipMap[membership.vehicleid] = membership.groupName;
        });

        return membershipMap;
    } catch (error) {
        console.error('Error fetching vehicle group memberships:', error);
        return {};
    }
};

/**
 * Transforms a flat vehicle data object from the view into the desired nested structure.
 * @param {object} vehicleData - The raw vehicle data object.
 * @param {number} speedingThreshold - The speeding threshold value.
 * @param {string|null} memberOfGroupName - The group name this vehicle belongs to (if any).
 * @returns {object|null} The structured vehicle object or null if input is invalid.
 */
const transformVehicleData = (vehicleData, speedingThreshold, memberOfGroupName = null) => {
  if (!vehicleData) return null;

  const drivers = [];
  if (vehicleData.driver1TachoId) {
    drivers.push({
      driverId: vehicleData.driverId1,
      driverName: vehicleData.driver1Name,
      driverCardId: vehicleData.driver1TachoId,
      remainingDriveTime: vehicleData.remainingDriveToday,
      workingState: vehicleData.driver1WorkingState,
    });
  }
  if (vehicleData.driver2TachoId) {
    drivers.push({
      driverId: vehicleData.driverId2,
      driverName: vehicleData.driver2Name,
      driverCardId: vehicleData.driver2TachoId,
      workingState: vehicleData.driver2WorkingState,
    });
  }

  const telltales = []; 
  const telltaleFields = ['TT_PAR_BRA', 'TT_FUE_LEV', 'TT_ENG_COO_TEM', 'TT_ENG_OIL', 'TT_ENG_MIL_IND', 'TT_ENG_EMI_FAI', 'TT_ADB_LEV'];
  for (const field of telltaleFields) {
    if (vehicleData[field] != null) {
      telltales.push({ [field]: vehicleData[field] });
    }
  }

  return {
    id: vehicleData.id,
    VIN: vehicleData.VIN,
    customerVehicleName: vehicleData.customerVehicleName,
    licensePlate: vehicleData.licensePlate,
    status: calculateStatus(vehicleData, speedingThreshold),
    type: vehicleData.type,
    brand: vehicleData.brand,
    typeIconClass: vehicleData.typeIconText,
    typeIconCode: vehicleData.typeIconCode,
    currentSpeed: vehicleData.currentSpeed,
    odoMeter: vehicleData.odoMeter,
    serviceDistance: vehicleData.serviceDistance,
    lastActivity: vehicleData.lastActivity,
    tripActive: vehicleData.tripActive,
    fuelLevel: vehicleData.fuelLevel,
    catalystFuelLevel: vehicleData.catalystFuelLevel,
    grossCombinationVehicleWeight: vehicleData.grossCombinationVehicleWeight,
    customerName: vehicleData.customerName,
    telltaleFields: vehicleData.telltaleFields,
    trailerName: vehicleData.trailerName,
    trailerId: vehicleData.trailerId,
    damageCount: vehicleData.damageCount,
    geofence: vehicleData.geofence,
    newVehicle: vehicleData.newVehicle,
    totDistanceToday: vehicleData.totDistanceToday,
    totFuelUsedToday: vehicleData.totFuelUsedToday,
    memberOf: memberOfGroupName, // Add group membership (group name)
    location: {
      latitude: vehicleData.last_Latitude,
      longitude: vehicleData.last_Longitude,
      heading: vehicleData.last_Heading,
    },
    drivers,
    telltales: telltales,
    tpmsVehicle: vehicleData.tpmsVehicle === 1 || vehicleData.tpmsVehicle === true,
    tpmsTrailer: vehicleData.tpmsTrailer === 1 || vehicleData.tpmsTrailer === true,
  };
};

// --- Main Service Class ---

export class VehicleService {

  static async getProcessedVehicles(customerId, options = {}) {
    const { search = '', since } = options;
    const whereClause = {};

    const customerSettings = await Settings.findOne({ where: { customer_id: customerId } });
    const speedingThreshold = customerSettings?.speedingThreshold || 90; 

    // Always filter by the selected customer ID from session
    whereClause.cust_id = customerId;

    if (search) {
      whereClause[Op.or] = [
        { customerVehicleName: { [Op.like]: `%${search}%` } },
        { licensePlate: { [Op.like]: `%${search}%` } },
        { driver1Name: { [Op.like]: `%${search}%` } },
        { driver2Name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { VIN: { [Op.like]: `%${search}%` } },
      ];
    }
    if (since) {
      whereClause.lastActivity = { [Op.gt]: new Date(since) };
    }
    
    const { count, rows } = await VehicleDetail.findAndCountAll({
      where: whereClause,
      raw: true,
      order: [['LastActivity', 'DESC']],
    });

    // Fetch groups for the current customer
    const groups = await fetchGroups(customerId);

    // Fetch vehicle group memberships
    const vehicleIds = rows.map(vehicle => vehicle.id);
    const vehicleGroupMemberships = await fetchVehicleGroupMemberships(vehicleIds);

    // Process vehicles with group membership information
    const processedVehicles = rows.map(vehicle => 
      transformVehicleData(
        vehicle, 
        speedingThreshold, 
        vehicleGroupMemberships[vehicle.id] || null
      )
    );

    return {
      totalCount: count,
      vehicles: processedVehicles,
      groups: groups
    };
  }
  
  static async getSingleVehicleDetails(id, customerId) {
    if (!id) throw new Error('ID is required.');
    
    const customerSettings = await Settings.findOne({ where: { customer_id: customerId } });
    const speedingThreshold = customerSettings?.speedingThreshold || 90;

    const vehicleDetails = await VehicleDetail.findOne({
      where: { 
        id,
        cust_id: customerId  // Also filter by customer for security
      },
      raw: true
    });

    if (!vehicleDetails) return null;

    // Fetch group membership for this specific vehicle
    const vehicleGroupMemberships = await fetchVehicleGroupMemberships([id]);
    const memberOfGroupName = vehicleGroupMemberships[id] || null;

    return transformVehicleData(vehicleDetails, speedingThreshold, memberOfGroupName);
  }

  static async getVehicleTPMSData(vehicleId, customerId) {
    try {
      // Query TPMS data for both vehicle and trailer
      const tpmsQuery = `
        SELECT 
          tpms.vin,
          tpms.device,
          tpms.sensors,
          tpms.lastUpdateDateTime,
          'vehicle' as source,
          v.customerVehicleName as name
        FROM tpms 
        INNER JOIN vehicles v ON v.VIN = tpms.vin 
        WHERE v.id = :vehicleId AND v.cust_id = :customerId
        
        UNION ALL
        
        SELECT 
          tpms.vin,
          tpms.device,
          tpms.sensors,
          tpms.lastUpdateDateTime,
          'trailer' as source,
          t.trailerName as name
        FROM tpms 
        INNER JOIN trailers t ON t.vin = tpms.vin
        INNER JOIN vehicles v ON v.VIN = t.vehicleVIN
        WHERE v.id = :vehicleId AND v.cust_id = :customerId AND t.copplingStatus = 1
      `;
      
      const results = await db.sequelize.query(tpmsQuery, {
        replacements: { vehicleId, customerId },
        type: db.sequelize.QueryTypes.SELECT
      });
      
      const processTPMSData = (tpmsRecord) => {
        if (!tpmsRecord || !tpmsRecord.sensors) return null;
        
        let sensors = [];
        try {
          sensors = JSON.parse(tpmsRecord.sensors);
        } catch (error) {
          console.error('Error parsing TPMS sensors JSON:', error);
          return null;
        }
        
        // Count issues (alerts)
        const issues = sensors.filter(sensor => sensor.alert === true).length;
        
        // Process tire data for visualization
        const tireData = sensors.map(sensor => ({
          axle: sensor.axle,
          position: sensor.position,
          pressure: sensor.pressure,
          temperature: sensor.temperature,
          sensorId: sensor.sensorid,
          batteryLevel: sensor.batterylevel,
          status: sensor.alert ? 'warning' : 'good',
          lastUpdate: sensor.createdDateTime
        }));
        
        // Sort by axle and position for consistent display
        tireData.sort((a, b) => {
          if (a.axle === b.axle) {
            return a.position - b.position;
          }
          return a.axle - b.axle;
        });
        
        return {
          available: true,
          issues: issues,
          lastUpdate: tpmsRecord.lastUpdateDateTime,
          device: tpmsRecord.device,
          name: tpmsRecord.name,
          tireData: tireData,
          sensors: sensors // Raw sensor data if needed
        };
      };
      
      // Process vehicle and trailer TPMS data
      const vehicleTPMS = results.find(r => r.source === 'vehicle');
      const trailerTPMS = results.find(r => r.source === 'trailer');
      
      return {
        vehicle: processTPMSData(vehicleTPMS) || { available: false, issues: 0, tireData: [] },
        trailer: processTPMSData(trailerTPMS) || { available: false, issues: 0, tireData: [] }
      };
      
    } catch (error) {
      console.error('Error fetching TPMS data:', error);
      throw error;
    }
  }

  static async getVehicleDriverData(vehicleId, customerId) {
    try {
      // First get the vehicle to find driver IDs
      const vehicle = await VehicleDetail.findOne({
        where: { 
          id: vehicleId,
          cust_id: customerId
        },
        attributes: ['driverId1', 'driverId2'],
        raw: true
      });
      
      if (!vehicle) {
        return null;
      }
      
      const driverIds = [];
      if (vehicle.driverId1) driverIds.push(vehicle.driverId1);
      if (vehicle.driverId2) driverIds.push(vehicle.driverId2);
      
      if (driverIds.length === 0) {
        return { drivers: [] };
      }
      
      // Import DriverService dynamically to avoid circular dependency
      const { DriverService } = await import('./driverService.js');
      
      // Get detailed info for each driver
      const driversPromises = driverIds.map(id => 
        DriverService.getDriverDetails(id, customerId)
      );
      
      const drivers = await Promise.all(driversPromises);
      
      return {
        drivers: drivers.filter(d => d !== null),
        primaryDriver: drivers[0] || null,
        secondaryDriver: drivers[1] || null
      };
      
    } catch (error) {
      console.error('Error fetching vehicle driver data:', error);
      throw error;
    }
  }

static async getVehicleTripsData(vehicleId, customerId, options = {}) {
    try {
      const limit = parseInt(options.limit, 10) || 10;

      // CHANGED: Query now joins the 'driver' table to get the driver's name
      const query = `
        SELECT
          t.Trip_NO as id,
          t.StartDate,
          t.EndDate,
          t.Distance as distanceKm,
          t.Duration,
          CONCAT(d.Lastname, ', ', d.Surname) AS driverName
        FROM trips t
        INNER JOIN vehicles v ON t.VIN = v.VIN
        LEFT JOIN driver d ON t.Driver1ID = d.tachoDriverIdentification
        WHERE
          v.id = :vehicleId AND
          v.cust_id = :customerId
        ORDER BY t.StartDate DESC
        LIMIT :limit
      `;

      const trips = await db.sequelize.query(query, {
        replacements: { vehicleId, customerId, limit },
        type: db.sequelize.QueryTypes.SELECT
      });

      // Format the raw data for the front-end
      return trips.map(trip => {
        const startDate = new Date(trip.StartDate);
        const endDate = new Date(trip.EndDate);

        // CHANGED: The returned object now includes the requested fields
        return {
          id: trip.id,
          driverName: trip.driverName || 'No driver assigned',
          distanceKm: parseFloat(trip.distanceKm).toFixed(0),
          duration: formatTripDuration(trip.Duration),
          date: startDate.toISOString().split('T')[0], // e.g., 2025-09-21
          startTime: startDate.toTimeString().substring(0, 5), // e.g., 08:30
          endTime: endDate.toTimeString().substring(0, 5),     // e.g., 16:45
        };
      });

    } catch (error)      {
      console.error('Error fetching vehicle trips data:', error);
      throw error;
    }
  }
  
 static async getSingleTripDetails(vehicleId, tripId, customerId) {
    try {
      // === Step 1: Securely fetch the trip's summary data ===
      const tripSummaryQuery = `
        SELECT
          t.VIN,
          t.StartDate,
          t.EndDate,
          t.Distance AS distance,
          t.Duration AS duration,
          t.FuelUsage AS fuelUsage, 
          v.customerVehicleName,
          IF (d.Lastname='' or d.Lastname is NULL,d.tachoDriverIdentification, concat(d.Lastname,', ',d.Surname)) AS Driver
        FROM trips t
          INNER JOIN vehicles v ON t.VIN = v.VIN
          left JOIN driver d ON t.Driver1ID = d.tachoDriverIdentification
        WHERE
          t.Trip_NO = :tripId AND
          v.id = :vehicleId AND
          v.cust_id = :customerId
        LIMIT 1;
      `;
      const trip = await db.sequelize.query(tripSummaryQuery, {
        replacements: { tripId, vehicleId, customerId },
        type: db.sequelize.QueryTypes.SELECT,
        plain: true
      });

      if (!trip) {
        return null; // Trip not found or user lacks access
      }

      // === Step 2: Calculate aggregates from the raw status data ===
      const aggregatesQuery = `
        SELECT
          SUM(fuelUsed) as totalFuelUsed,
          -- CHANGED: Only count telltales that are RED or YELLOW
          COUNT(CASE WHEN triggerType = 'TELL_TALE' AND tellTale_State IN ('RED', 'YELLOW') THEN 1 END) as telltaleCount
        FROM vehiclestatus
        WHERE
          vin = :vin AND
          createdDateTime BETWEEN :startDate AND :endDate;
      `;
      const aggregates = await db.sequelize.query(aggregatesQuery, {
        replacements: {
          vin: trip.VIN,
          startDate: trip.StartDate,
          endDate: trip.EndDate
        },
        type: db.sequelize.QueryTypes.SELECT,
        plain: true
      });

      // === Step 3: Fetch the complete, unfiltered event timeline ===
      const eventTimelineQuery = `
        SELECT
          createdDateTime AS timestamp,
          triggerType,
          driver1WorkingState,
          wheelBasedSpeed,
          GNSS_latitude AS latitude,
          GNSS_longitude AS longitude,
          tellTale,
          tellTale_State,
          hrTotalVehicleDistance, -- NEW: Select total vehicle distance
          TS_PTO_ENABLED,         -- NEW: Select PTO status
          -- CHANGED: Calculate delay duration in hh:mm format, or return NULL
          CASE 
            WHEN TIMESTAMPDIFF(MINUTE, createdDateTime, receivedDateTime) > 15 
            THEN TIME_FORMAT(TIMEDIFF(receivedDateTime, createdDateTime), '%H:%i')
            ELSE NULL 
          END AS delayDuration
        FROM 
          vehiclestatus
        WHERE 
          vin = :vin AND
          createdDateTime BETWEEN :startDate AND :endDate AND
          GNSS_latitude IS NOT NULL AND 
          GNSS_longitude IS NOT NULL
        ORDER BY 
          createdDateTime ASC;
      `;
      const events = await db.sequelize.query(eventTimelineQuery, {
        replacements: {
          vin: trip.VIN,
          startDate: trip.StartDate,
          endDate: trip.EndDate
        },
        type: db.sequelize.QueryTypes.SELECT
      });

      // === Step 4: Assemble the final response object ===
      return {
        tripDetails: {
          id: tripId,
          vehicle: trip.customerVehicleName,
          driver: trip.Driver || 'No driver assigned',
          distance: parseFloat(trip.distance).toFixed(2),
          duration: trip.duration,
          startDate: trip.StartDate,
          endDate: trip.EndDate,
          fuelUsed: aggregates.totalFuelUsed || 0,
          fuelUsage: parseFloat(trip.fuelUsage).toFixed(2),
          telltaleCount: parseInt(aggregates.telltaleCount) || 0,
        },
        events: events.map(event => ({
          type: event.triggerType,
          latitude: event.latitude,
          longitude: event.longitude,
          timestamp: event.timestamp,
          wheelBasedSpeed: event.wheelBasedSpeed,
          totalDistanceKm: Math.round(event.hrTotalVehicleDistance / 1000),
          ptoActive: Boolean(event.TS_PTO_ENABLED),
          ...(event.delayDuration && { delay: event.delayDuration }),
          ...(event.tellTale && {
            telltale: {
              name: event.tellTale,
              state: event.tellTale_State
            }
          })
        }))
      };
    } catch (error) {
      console.error(`Error fetching details for trip ${tripId}:`, error);
      throw error;
    }
  }

  static async getVehicleDamageData(vehicleId, customerId) {
    // Implementation for damage data
  }
}