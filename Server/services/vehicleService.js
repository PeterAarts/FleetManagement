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
 * Transforms a flat vehicle data object from the view into the desired nested structure.
 * @param {object} vehicleData - The raw vehicle data object.
 * @returns {object|null} The structured vehicle object or null if input is invalid.
 */
const transformVehicleData = (vehicleData, speedingThreshold) => {
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
    location: {
      latitude: vehicleData.last_Latitude,
      longitude: vehicleData.last_Longitude,
      heading: vehicleData.last_Heading,
    },
    drivers,
    telltales: telltales,
  };
};

// --- Main Service Class ---

export class VehicleService {

  static async getProcessedVehicles(customerId, groupId, options = {}) {
    const { search = '', since } = options;
    const whereClause = {};

    const customerSettings = await Settings.findOne({ where: { id: customerId } });
    const speedingThreshold = customerSettings?.speedingThreshold || 90; 


    if (groupId && groupId !== '*') {
      whereClause.cust_id = groupId;
    } else {
      const customer = await Customer.findByPk(customerId, {
        include: [{ model: Customer, as: 'relatedCustomers', attributes: ['id'] }]
      });
      const customerIds = [customerId, ...(customer?.relatedCustomers?.map(c => c.id) || [])];
      whereClause.cust_id = { [Op.in]: customerIds };
    }

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

    const processedVehicles = rows.map(vehicle => transformVehicleData(vehicle, speedingThreshold));

    return {
      totalCount: count,
      vehicles: processedVehicles
    };
  }
  
  static async getSingleVehicleDetails(id) {
    if (!id) throw new Error('ID is required.');
    const customerSettings = await Settings.findOne({ where: { cust_id: customerId } });
    const speedingThreshold = customerSettings?.speedingThreshold || 90;

    const vehicleDetails = await VehicleDetail.findOne({
      where: { id },
      raw: true
    });

    return transformVehicleData(vehicleDetails, speedingThreshold);
  }
}