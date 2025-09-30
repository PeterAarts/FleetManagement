// models/vehicleDetail.js
import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const VehicleDetail = sequelize.define('VehicleDetail', {
    // --- Core Vehicle Fields ---
    id:                               { type: DataTypes.INTEGER,primaryKey: true,allowNull: false},
    VIN:                              { type: DataTypes.STRING },
    customerVehicleName:              { type: DataTypes.STRING },
    licensePlate:                     { type: DataTypes.STRING },
    currentSpeed:                     { type: DataTypes.DECIMAL(5, 2) },
    odoMeter:                         { type: DataTypes.INTEGER },
    grossCombinationVehicleWeight:    { type: DataTypes.INTEGER },
    fuelLevel:                        { type: DataTypes.INTEGER },
    catalystFuelLevel:                { type: DataTypes.INTEGER },
    serviceDistance:                  { type: DataTypes.INTEGER },
    lastActivity:                     { type: DataTypes.DATE },
    last_Latitude:                    { type: DataTypes.DECIMAL(16, 9) },
    last_Longitude:                   { type: DataTypes.DECIMAL(16, 9) },
    last_Heading:                     { type: DataTypes.INTEGER },
    tripActive:                       { type: DataTypes.BOOLEAN },

    type:                             { type: DataTypes.STRING },
    brand:                            { type: DataTypes.STRING },
    cust_id:                          { type: DataTypes.INTEGER },
    customerName:                     { type: DataTypes.STRING },

    // --- Driver Fields ---
    driver1TachoId:                   { type: DataTypes.STRING },
    driver2TachoId:                   { type: DataTypes.STRING },
    driverId1:                        { type: DataTypes.INTEGER },
    driverId2:                        { type: DataTypes.INTEGER },
    driver1Name:                      { type: DataTypes.STRING },
    driver2Name:                      { type: DataTypes.STRING },
    driver1WorkingState:              { type: DataTypes.STRING },
    driver2WorkingState:              { type: DataTypes.STRING },
    remainingDriveToday:              { type: DataTypes.STRING }, // SEC_TO_TIME returns a string like '10:00:00'
    // --- Calculated & Status Fields ---
    newVehicle:                       { type: DataTypes.BOOLEAN },
    geofence:                         { type: DataTypes.BOOLEAN },
    totDistanceToday:                 { type: DataTypes.DECIMAL },
    totFuelUsedToday:                 { type: DataTypes.DECIMAL },
    trailerName:                      { type: DataTypes.STRING },
    trailerId:                        { type: DataTypes.INTEGER },
    damageCount:                      { type: DataTypes.INTEGER },
    severeDamageCount:                { type: DataTypes.INTEGER },
    // --- Telltale Warning Fields ---
    TT_PAR_BRA:                       { type: DataTypes.BOOLEAN }, // Or INTEGER
    TT_FUE_LEV:                       { type: DataTypes.BOOLEAN },
    TT_ENG_COO_TEM:                   { type: DataTypes.BOOLEAN },
    TT_ENG_OIL:                       { type: DataTypes.BOOLEAN },
    TT_ENG_MIL_IND:                   { type: DataTypes.BOOLEAN },
    TT_ENG_EMI_FAI:                   { type: DataTypes.BOOLEAN },
    TT_ADB_LEV:                       { type: DataTypes.BOOLEAN },
    
    typeIconText:                     { type: DataTypes.STRING },
    typeIconCode:                     { type: DataTypes.STRING },
    tpmsVehicle:                      { type: DataTypes.BOOLEAN },
    tpmsTrailer:                      { type: DataTypes.BOOLEAN },
  }, {
    tableName: 'v_vehicle_details', // Point to the view name
    timestamps: false
  });

  return VehicleDetail;
}