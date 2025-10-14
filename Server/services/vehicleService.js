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
 * Calculates warning messages for a vehicle based on dates and levels
 * @param {object} vehicle - The vehicle data object
 * @returns {string} HTML string of warnings or empty string
 */
const calculateWarnings = (vehicle) => {
  const warnings = [];
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  threeMonthsLater.setHours(23, 59, 59, 999);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // MOT/Service date check
  if (vehicle.nextServiceDate) {
    try {
      const validityDate = new Date(vehicle.nextServiceDate);
      validityDate.setHours(0, 0, 0, 0);
      
      if (validityDate < currentDate) {
        warnings.push(`<li><STRONG>Your MOT IS EXPIRED </STRONG>(expired on ${validityDate.toISOString().split('T')[0]})</li>`);
      } else if (validityDate <= threeMonthsLater) {
        warnings.push(`<li>Your vehicle is due MOT within 3 months (on ${validityDate.toISOString().split('T')[0]})</li>`);
      }
    } catch (e) {
      console.error('Error parsing MOT date:', e);
    }
  }

  // Tachograph date check
  if (vehicle.tachographRevokeDate) {
    try {
      const tachoDate = new Date(vehicle.tachographRevokeDate);
      tachoDate.setHours(0, 0, 0, 0);
      
      if (tachoDate < currentDate) {
        warnings.push(`<li><strong>Your TACHOGRAPH is no longer VALID for use, calibration is EXPIRED</strong> (expired on ${tachoDate.toISOString().split('T')[0]})</li>`);
      } else if (tachoDate <= threeMonthsLater) {
        warnings.push(`<li>Your Tachograph calibration will expire within 3 months (on ${tachoDate.toISOString().split('T')[0]})</li>`);
      }
    } catch (e) {
      console.error('Error parsing tachograph date:', e);
    }
  }

  // Last activity check
  if (vehicle.lastActivity) {
    try {
      const lastActivityDate = new Date(vehicle.lastActivity);
      if (lastActivityDate < sixMonthsAgo) {
        warnings.push(`<li>Last vehicle activity was more than 6 months ago (on ${lastActivityDate.toISOString().split('T')[0]})</li>`);
      }
    } catch (e) {
      console.error('Error parsing last activity date:', e);
    }
  }

  // Fuel level check
  if (vehicle.fuelLevel != null && vehicle.fuelLevel < 2) {
    warnings.push(`<li>Fuel level too low at ${vehicle.fuelLevel}%</li>`);
  }

  // AdBlue level check
  if (vehicle.catalystFuelLevel != null && vehicle.catalystFuelLevel < 2) {
    warnings.push(`<li>AdBlue level too low at ${vehicle.catalystFuelLevel}%</li>`);
  }

  return warnings.length > 0 ? `<ul>${warnings.join('')}</ul>` : '';
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
  
  // Parse possibleFuelType from JSON string
  let fuelTypes = [];
  let fuelTypeDisplay = '';
  
  if (vehicleData.possibleFuelType) {
    try {
      const parsed = JSON.parse(vehicleData.possibleFuelType);
      if (Array.isArray(parsed)) {
        fuelTypes = parsed;
        fuelTypeDisplay = parsed.join(', '); // "DIESEL" or "DIESEL, ELECTRIC"
      }
    } catch (e) {
      fuelTypeDisplay = vehicleData.possibleFuelType; // Fallback to raw string
    }
  } 

  return {
    id: vehicleData.id,
    VIN: vehicleData.VIN,
    customerVehicleName: vehicleData.customerVehicleName,
    
    // Primary fields (camelCase)
    licensePlate: vehicleData.licensePlate,
    odoMeter: vehicleData.odoMeter,
    fuelLevel: vehicleData.fuelLevel,
    catalystFuelLevel: vehicleData.catalystFuelLevel,
    
    // Case aliases (PascalCase) for backward compatibility
    LicensePlate: vehicleData.licensePlate,
    OdoMeter: vehicleData.odoMeter,
    FuelLevel: vehicleData.fuelLevel,
    CatalystFuelLevel: vehicleData.catalystFuelLevel,
    
    status: calculateStatus(vehicleData, speedingThreshold),
    type: vehicleData.type,
    brand: vehicleData.brand,
    model: vehicleData.model,
    typeIconClass: vehicleData.typeIconText,
    typeIconCode: vehicleData.typeIconCode,
    currentSpeed: vehicleData.currentSpeed,
    serviceDistance: vehicleData.serviceDistance/1000,
    lastActivity: vehicleData.lastActivity,
    tripActive: vehicleData.tripActive,
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
    memberOf: memberOfGroupName,
    
    // Additional fields from database (may be null)
    vehicleOutofService: vehicleData.vehicleOutofService,
    totalFuelTankVolume: vehicleData.totalFuelTankVolume,
    noOfAxles: vehicleData.noOfAxles,
    tachographType: vehicleData.tachographType,
    possibleFuelType: fuelTypeDisplay,
    emissionLevel: vehicleData.emissionLevel,
    productionDate: vehicleData.productionDate,
    gearboxType: vehicleData.gearboxType,
    engineTotalFuelUsed: vehicleData.engineTotalFuelUsed/1000,
    TotalEngineHours: vehicleData.TotalEngineHours,
    ambientAirTemperature: vehicleData.ambientAirTemperature,
    engineCoolantTemperature: vehicleData.engineCoolantTemperature,
    serviceBrakeAirPressureCircuit1: vehicleData.serviceBrakeAirPressureCircuit1,
    serviceBrakeAirPressureCircuit2: vehicleData.serviceBrakeAirPressureCircuit2,
    
    // Computed fields
    brandModel: vehicleData.brand && vehicleData.model ? `${vehicleData.brand} ${vehicleData.model}` : vehicleData.brand || null,
    brakeAirPressure: vehicleData.serviceBrakeAirPressureCircuit1 && vehicleData.serviceBrakeAirPressureCircuit2 
      ? `${vehicleData.serviceBrakeAirPressureCircuit1}/${vehicleData.serviceBrakeAirPressureCircuit2}` 
      : null,
    
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

  static async getVehicleDetailsWithForm(id, customerId) {
  try {
    // Get vehicle details
    const vehicleData = await this.getSingleVehicleDetails(id, customerId);
    if (!vehicleData) {
      return null;
    }
    // Fetch MOT and tachograph dates for warning calculation
    const datesQuery = `
      SELECT 
        mr.next_service_date as nextServiceDate,
        mr.tachograph_revoke_date as tachographRevokeDate
      FROM MOT_REGISTER mr
      INNER JOIN vehicles v ON v.VIN = mr.vehicle
      WHERE v.id = :vehicleId AND v.cust_id = :customerId
      LIMIT 1
    `;

    const dates = await db.sequelize.query(datesQuery, {
      replacements: { vehicleId: id, customerId },
      type: db.sequelize.QueryTypes.SELECT,
      plain: true
    });

    // Add dates to vehicle data for warning calculation
    if (dates) {
      vehicleData.nextServiceDate = dates.nextServiceDate;
      vehicleData.tachographRevokeDate = dates.tachographRevokeDate;
    }

    // Calculate and add warning field
    vehicleData.warning = calculateWarnings(vehicleData);

    // Fetch formBuild definition
    const formBuildQuery = `
      SELECT 
        id, \`table\`, form, field, label, \`column\`, columnSize, row, sequence,
        \`group\`, type, size, height, pattern, value, editable, icon, accessLevel
      FROM formbuilder
      WHERE \`table\` = 'vehicles'
      ORDER BY \`column\` ASC, row ASC, sequence ASC
    `;

    const formBuild = await db.sequelize.query(formBuildQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    return {
      data: vehicleData,
      formBuild: formBuild || []
    };

  } catch (error) {
    console.error('Error fetching vehicle details with form:', error);
    throw error;
  }
}
  
  static async getVehicleTPMSData(vehicleId, customerId) {
    try {
      // MODIFIED: The query now fetches all required fields from the tpms table
      // to match the structure of your example JSON.
      const tpmsQuery = `
        SELECT 
          tpms.id,
          tpms.vin,
          tpms.device,
          tpms.isVehicle,
          tpms.isTrailer,
          tpms.countFrontAxel,
          tpms.countRearAxel,
          tpms.sensors,
          tpms.lastUpdateDateTime,
          tpms.createdDateTime
        FROM tpms 
        INNER JOIN vehicles v ON v.VIN = tpms.vin 
        WHERE v.id = :vehicleId AND v.cust_id = :customerId
        
        UNION ALL
        
        SELECT 
          tpms.id,
          tpms.vin,
          tpms.device,
          tpms.isVehicle,
          tpms.isTrailer,
          tpms.countFrontAxel,
          tpms.countRearAxel,
          tpms.sensors,
          tpms.lastUpdateDateTime,
          tpms.createdDateTime
        FROM tpms 
        INNER JOIN trailers t ON t.vin = tpms.vin
        INNER JOIN vehicles v ON v.VIN = t.vehicleVIN
        WHERE v.id = :vehicleId AND v.cust_id = :customerId AND t.copplingStatus = 1
      `;
      
      const results = await db.sequelize.query(tpmsQuery, {
        replacements: { vehicleId, customerId },
        type: db.sequelize.QueryTypes.SELECT
      });

      if (!results || results.length === 0) {
        return []; // Return an empty array if no TPMS data is found
      }

      // Process the results into an array of objects,
      // parsing the 'sensors' JSON string along the way.
      const processedData = results.map(record => {
        let parsedSensors = [];
        try {
          if (record.sensors) {
            parsedSensors = JSON.parse(record.sensors);
          }
        } catch (error) {
          console.error(`Error parsing sensors JSON for VIN ${record.vin}:`, error);
        }
        
        return {
          id: record.id,
          vin: record.vin,
          device: record.device,
          isTrailer: record.isTrailer,
          isVehicle: record.isVehicle,
          countFrontAxel: record.countFrontAxel,
          countRearAxel: record.countRearAxel,
          sensors: parsedSensors, // Assign the parsed array of sensor objects
          lastUpdateDateTime: record.lastUpdateDateTime,
          createdDateTime: record.createdDateTime,
        };
      });
      return processedData;
      
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

  static async getVehicleGeofenceData(vehicleId, customerId) {
    try {
      const query = `
        SELECT
          gl.id AS eventId,
          gl.createdDateTime AS eventTimestamp,
          gl.status AS trigger, -- ALIASED: 'status' from the DB is now 'trigger' in the response
          gl.alert,
          gd.name AS geofenceName,
          gd.id AS geofenceDefId,
          gr.range
        FROM geofence_log gl
          JOIN vehicles v ON v.vin = gl.vin
          LEFT JOIN geofence_def gd ON gd.id = gl.geofence_id
          LEFT JOIN geofence_reg gr ON gr.geofence_id = gl.geofence_id AND gr.vin = gl.vin
        WHERE
          v.id = :vehicleId AND
          v.cust_id = :customerId
        ORDER BY 
          gl.createdDateTime DESC
        LIMIT 10;
      `;

      const geofenceEvents = await db.sequelize.query(query, {
        replacements: { vehicleId, customerId },
        type: db.sequelize.QueryTypes.SELECT
      });

      return geofenceEvents;

    } catch (error) {
      console.error(`Error fetching geofence event data for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }
  static async getVehicleTripsData(vehicleId, customerId, options = {}) {
    try {
      const limit = parseInt(options.limit, 10) || 10;

      // CHANGED: Query now joins the 'driver' table to get the driver's name
      const query = `
        SELECT
          t.Trip_NO AS id,
          IF(d.Lastname is NULL or d.Lastname='',d.tachoDriverIdentification,CONCAT(d.Lastname,', ',d.Surname)) AS driver,
          date(t.StartDate) as date,
          time(t.startdate) as startTime,
          time(t.enddate) as endTime,
          d.id as DriverId,
          t.Distance,
          t.FuelUsed,
          ROUND(100/(SUM(t.Distance)/SUM(t.FuelUsed)),1) AS FuelUsage,
          ROUND(SUM(t.CO2_emission),0) AS CO2_emission,
          DATE_FORMAT(SEC_TO_TIME(SUM(TIME_TO_SEC(t.Duration))),'%H:%i') AS Duration,
          DATE_FORMAT(SEC_TO_TIME(SUM(t.DriveTime)),'%H:%i') AS DriveTime,
          DATE_FORMAT(SEC_TO_TIME(SUM(t.IdleTime)),'%H:%i') AS IdleTime,
          (SELECT DATEDIFF(t.startdate,pdc_register.createdDate) FROM PDC_REGISTER    		        WHERE date(pdc_register.createdDate)<date(t.startdate) AND pdc_register.vehicle=t.vin ORDER BY pdc_register.createdDate DESC LIMIT 1) AS DAYS_NO_PDC,
          (SELECT round(t.end_odometer/1000)-pdc_register.vehicle_odometer FROM PDC_REGISTER			WHERE date(pdc_register.createdDate)<date(t.startdate) AND pdc_register.vehicle=t.vin ORDER BY pdc_register.createdDate DESC LIMIT 1) AS KM_NO_PDC,
          (SELECT COUNT(id) FROM PDC_REGISTER         WHERE date(pdc_register.createdDate)=date(t.startdate) AND pdc_register.vehicle=t.vin) AS has_PDC,
          (SELECT COUNT(damages) FROM PDC_REGISTER    WHERE date(pdc_register.createdDate)=date(t.startdate) AND pdc_register.vehicle=t.vin) AS Count_Damages
        FROM trips t
          LEFT JOIN vehicles v ON t.VIN = v.VIN
          LEFT JOIN driver d ON t.Driver1ID = d.tachoDriverIdentification
        WHERE
          v.id = :vehicleId AND
          v.cust_id = :customerId AND
          t.Distance > 2
        GROUP BY 
          t.trip_no 
        ORDER BY t.StartDate DESC
        LIMIT :limit
      `;

      const trips = await db.sequelize.query(query, {
        replacements: { vehicleId, customerId, limit },
        type: db.sequelize.QueryTypes.SELECT
      });

      // Format the raw data for the front-end
      return trips.map(trip => {
        return {
          id: trip.id,
          driverName: trip.driver || 'No driver assigned',
          distance: trip.Distance,
          duration: formatTripDuration(trip.Duration),
          fuelUsed: trip.FuelUsed,
          fuelUsage: trip.FuelUsage,
          CO2_emission: trip.CO2_emission,
          has_PDC: trip.has_PDC,
          driveTime: trip.DriveTime,
          idleTime: trip.IdleTime,
          daysNoPDC: trip.DAYS_NO_PDC,
          date: trip.date,
          startTime: trip.startTime,
          endTime: trip.endTime,
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
          driver2WorkingState, 
          triggerInfo,  
          wheelBasedSpeed,
          GNSS_latitude AS latitude,
          GNSS_longitude AS longitude,
          tellTale,
          tellTale_State,
          hrTotalVehicleDistance, 
          TS_PTO_ENABLED,         
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
          driver1WorkingState: event.driver1WorkingState,
          driver2WorkingState: event.driver2WorkingState,
          triggerInfo: event.triggerInfo,
          tellTale: event.tellTale,              // Always include at top level
          tellTale_State: event.tellTale_State,  // Always include at top level
          ...(event.delayDuration && { delay: event.delayDuration })
        }))
      };
    } catch (error) {
      console.error(`Error fetching details for trip ${tripId}:`, error);
      throw error;
    }
  }

/**
   * Fetches all open damage reports for a specific vehicle.
   * Based on the provided production query.
   * @param {number} vehicleId - The ID of the vehicle.
   * @param {number} customerId - The ID of the customer for security scoping.
   * @returns {Promise<Array>} A promise that resolves to an array of damage objects.
   */
  static async getVehicleDamageData(vehicleId, customerId) {
    try {
      const query = `
        SELECT
          p.id,
          DATE(p.createdDateTime) AS createdDate,
          TIME(p.createdDateTime) AS createdTime,
          CONCAT(u.lname, ', ', u.fname) AS registrar,
          p.severity,
          CONCAT(c.cat_name, ' / ', IFNULL(sc.subcat_name, '-'), ' / ', di.title) AS description,
          p.description AS driverDescription,
          p.repairStatus,
          di.title AS damage,
          c.cat_name AS category,
          sc.subcat_name AS subcategory
        FROM pdc_damage p
          LEFT JOIN vehicles v ON v.vin = p.vin
          LEFT JOIN users u ON u.id = p.UserId
          LEFT JOIN pdc_damageitems di ON di.ID = p.eventID
          LEFT JOIN pdc_categories c ON c.ID = di.cat_id
          LEFT JOIN pdc_subcategories sc ON sc.ID = di.subcat_id
        WHERE
          v.id = :vehicleId AND
          v.cust_id = :customerId AND
          p.repairStatus = 0 AND
          c.cat_type_id = 1
        GROUP BY
          p.id
        ORDER BY
          p.createdDateTime ASC, p.repairStatus ASC;
      `;

      const damages = await db.sequelize.query(query, {
        replacements: { vehicleId, customerId },
        type: db.sequelize.QueryTypes.SELECT
      });

      return damages;

    } catch (error) {
      console.error(`Error fetching damage data for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }
  static async getVehicleGeofenceData(vehicleId, customerId) {
  try {
    const query = `
      SELECT
        gl.id AS eventId,
        gl.createdDateTime AS eventTimestamp,
        DATE(gl.createdDateTime) AS date,
        gl.status AS 'trigger',
        gl.alert,
        gd.name AS geofenceName,
        gd.id AS geofenceDefId,
        gr.range 
      FROM geofence_log gl
        JOIN vehicles v ON v.vin = gl.vin
        LEFT JOIN geofence_def gd ON gd.id = gl.geofence_id
        LEFT JOIN geofence_reg gr ON gr.geofence_id = gl.geofence_id AND gr.vin = gl.vin
      WHERE
        v.id = :vehicleId AND
        v.cust_id = :customerId
      ORDER BY 
        gl.createdDateTime DESC
      LIMIT 10;
    `;

    const geofenceEvents = await db.sequelize.query(query, {
      replacements: { vehicleId, customerId },
      type: db.sequelize.QueryTypes.SELECT
    });

    // Format for frontend
    return geofenceEvents.map(event => ({
      id: event.eventId,
      date: event.date,
      timestamp: event.eventTimestamp,
      geofenceName: event.geofenceName,
      type: event.trigger?.toLowerCase(), // 'enter' or 'exit'
      alert: event.alert
    }));

  } catch (error) {
    console.error(`Error fetching geofence event data for vehicle ${vehicleId}:`, error);
    throw error;
  }
}

  /**
   * Fetches vehicle status points around a specific geofence LOG event.
   * (2 before, the breach, 2 after)
   * @param {number} vehicleId The ID of the vehicle.
   * @param {number} eventId The ID of the geofence_log event.
   * @param {number} customerId The ID of the customer for security.
   * @returns {Promise<Array>} A promise that resolves to an array of vehiclestatus objects.
   */
  static async getGeofenceEventDetails(vehicleId, eventId, customerId) {
  try {
    const eventQuery = `
      SELECT 
        gl.id AS eventId,
        gl.createdDateTime AS eventTimestamp,
        gl.latitude AS breachLatitude,
        gl.longitude AS breachLongitude,
        gl.status AS eventTrigger,
        gl.alert,
        gl.vin,
        gd.name AS geofenceName,
        gd.id AS geofenceDefId  -- Return the definition ID
      FROM geofence_log gl
        JOIN vehicles v ON v.vin = gl.vin
        LEFT JOIN geofence_def gd ON gd.id = gl.geofence_id
      WHERE 
        gl.id = :eventId AND
        v.id = :vehicleId AND
        v.cust_id = :customerId
      LIMIT 1;
    `;
    
    const event = await db.sequelize.query(eventQuery, {
      replacements: { eventId, vehicleId, customerId },
      type: db.sequelize.QueryTypes.SELECT,
      plain: true
    });

    if (!event) {
      return null;
    }

    // Fetch context points (2 before + breach + 2 after)
    const contextQuery = `
      (
        SELECT
          createdDateTime,
          GNSS_latitude AS lat,
          GNSS_longitude AS lng,
          wheelBasedSpeed AS speed,
          'before' AS pointType
        FROM vehiclestatus
        WHERE 
          vin = :vin AND 
          triggerType = 'timer' AND 
          createdDateTime < :breachTimestamp
        ORDER BY createdDateTime DESC
        LIMIT 2
      )
      UNION ALL
      (
        SELECT
          :breachTimestamp AS createdDateTime,
          :breachLat AS lat,
          :breachLng AS lng,
          NULL AS speed,
          'breach' AS pointType
      )
      UNION ALL
      (
        SELECT
          createdDateTime,
          GNSS_latitude AS lat,
          GNSS_longitude AS lng,
          wheelBasedSpeed AS speed,
          'after' AS pointType
        FROM vehiclestatus
        WHERE 
          vin = :vin AND 
          triggerType = 'timer' AND 
          createdDateTime > :breachTimestamp
        ORDER BY createdDateTime ASC
        LIMIT 2
      )
      ORDER BY createdDateTime ASC;
    `;

    const contextPoints = await db.sequelize.query(contextQuery, {
      replacements: {
        vin: event.vin,
        breachTimestamp: event.eventTimestamp,
        breachLat: event.breachLatitude,
        breachLng: event.breachLongitude
      },
      type: db.sequelize.QueryTypes.SELECT
    });

    return {
      eventId: event.eventId,
      geofenceName: event.geofenceName,
      geofenceDefId: event.geofenceDefId, // Include the definition ID
      trigger: event.eventTrigger,
      timestamp: event.eventTimestamp,
      contextPoints: contextPoints.map(point => ({
        lat: parseFloat(point.lat),
        lng: parseFloat(point.lng),
        timestamp: point.createdDateTime,
        speed: point.speed,
        isBreach: point.pointType === 'breach'
      }))
    };

  } catch (error) {
    console.error(`Error fetching geofence event details for event ${eventId}:`, error);
    throw error;
  }
}
}