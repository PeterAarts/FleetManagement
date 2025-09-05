import { DataTypes } from 'sequelize';
export default function(sequelize) {

  const driverValidator = async (value) => {
    if (!value) return;
    const driver = await sequelize.models.Driver.findOne({ 
      where: { tachoDriverIdentification: value } 
    });
    if (!driver) {
      throw new Error(`Driver with Tacho ID ${value} does not exist.`);
    }
  };

  const Vehicle = sequelize.define('Vehicle', {
    id:                       {autoIncrement: true,type: DataTypes.INTEGER,allowNull: false,primaryKey: true},
    VIN:                      {type: DataTypes.STRING(17),allowNull: true,unique: "VIN"},
    customerVehicleName:      {type: DataTypes.STRING(28),allowNull: true,defaultValue: "-"},
    brand:                    {type: DataTypes.STRING(28),allowNull: true},
    cust_id:                  {type: DataTypes.INTEGER,allowNull: true,references: {model: 'Customers',key: 'id'}},
    vehicleActive:            {type: DataTypes.BOOLEAN,allowNull: true},
    productionDate:           {type: DataTypes.DATEONLY,allowNull: true},
    type:                     {type: DataTypes.STRING(24),allowNull: true,defaultValue: "Truck"},
    model:                    {type: DataTypes.STRING(28),allowNull: true},
    LicensePlate:             {type: DataTypes.STRING(20),allowNull: true,defaultValue: "-"},
    OdoMeter:                 {type: DataTypes.INTEGER,allowNull: true},
    fuelLevel:                {type: DataTypes.INTEGER,allowNull: true},
    catalystFuelLevel:        {type: DataTypes.INTEGER,allowNull: true},
    serviceDistance:          {type: DataTypes.INTEGER,allowNull: true},
    LastActivity:             {type: DataTypes.DATE,allowNull: true,defaultValue: DataTypes.NOW},
    last_Latitude:            {type: DataTypes.DECIMAL(16, 9),allowNull: true},
    last_Longitude:           {type: DataTypes.DECIMAL(16, 9),allowNull: true},
    last_Heading:             {type: DataTypes.INTEGER,allowNull: true},
    tripActive:               {type: DataTypes.BOOLEAN,allowNull: true},
    currentSpeed:             {type: DataTypes.DECIMAL(5, 2),allowNull: true},
    Driver1_ID:               {type: DataTypes.STRING(16),allowNull: true,references: {model: 'Driver',key: 'tachoDriverIdentification'},validate: {driverExists: driverValidator}},
    Driver2_ID:               {type: DataTypes.STRING(16),allowNull: true,references: {model: 'Driver',key: 'tachoDriverIdentification'},validate: {driverExists: driverValidator}},
  }, {
    tableName: 'vehicles',
    timestamps: false
  });

  Vehicle.associate = (models) => {
        // --- ADD THESE DEBUG LINES ---
    console.log('--- Debugging Associations in Vehicle Model ---');
    console.log('Available models in "models" object:', Object.keys(models));
    console.log('Is models.Driver defined?', !!models.Driver);
    console.log('Is models.Customer defined?', !!models.Customer);
    // ----------------------------
    Vehicle.belongsTo(models.Customer, { foreignKey: 'cust_id' });
    Vehicle.belongsTo(models.Driver,   { foreignKey: 'Driver1_ID', targetKey: 'tachoDriverIdentification', as: 'Driver1' });
    Vehicle.belongsTo(models.Driver,   { foreignKey: 'Driver2_ID', targetKey: 'tachoDriverIdentification', as: 'Driver2' });
    Vehicle.hasMany(models.Trailer, { foreignKey: 'vehicleVIN', sourceKey: 'VIN' });
    Vehicle.hasMany(models.Damage, { foreignKey: 'vin', sourceKey: 'VIN' });
    Vehicle.hasMany(models.GeofenceReg, { foreignKey: 'vin', sourceKey: 'VIN' });
  };

  return Vehicle;
}