// models/Trailer.js
export default (sequelize, DataTypes) => {
  const Trailer = sequelize.define('Trailer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vin: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    cust_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customer_customer',
        key: 'custId'
      }
    },
    vehicleVIN: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'vehicles',
        key: 'VIN'
      }
    },
    trailerName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    LicensePlate: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    emptyWeight: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    maxWeight: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    currentWeight: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    copplingStatus: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    hasDoorControl: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    hasTemperatureControl: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    hasAxleWeightControl: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    hasCoolingControl: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    hasTelematics: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    hasEBSControl: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    hasTPMS: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    currentTemperatureStatus: {
      type: DataTypes.JSON,
      allowNull: true
    },
    currentCoolingStatus: {
      type: DataTypes.JSON,
      allowNull: true
    },
    currentDoorStatus: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ebsStatus: {
      type: DataTypes.JSON,
      allowNull: true
    },
    axleWeightStatus: {
      type: DataTypes.JSON,
      allowNull: true
    },
    telematicsStatus: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tpmsStatus: {
      type: DataTypes.JSON,
      allowNull: true
    },
    batteryState: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    LastActivity: {
      type: DataTypes.DATE,
      allowNull: true
    },
    AddDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    UpdateDateTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_Latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true
    },
    last_Longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true
    },
    last_Heading: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    last_Altitude: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    tripActive: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0
    },
    trailerActive: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    ambientAirTemperature: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    odoMeter: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    currentSpeed: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    serviceDistance: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    noOfAxles: {
      type: DataTypes.STRING(10),
      allowNull: true
    }
  }, {
    tableName: 'trailers',
    timestamps: false,
    indexes: [
      {
        fields: ['vin']
      },
      {
        fields: ['cust_id']
      },
      {
        fields: ['vehicleVIN']
      }
    ]
  });

  // Define associations
  Trailer.associate = (models) => {
    // A trailer belongs to a customer
    Trailer.belongsTo(models.Customer, {
      foreignKey: 'cust_id',
      as: 'customer'
    });

    // A trailer can be attached to a vehicle
    Trailer.belongsTo(models.VehicleDetail, {
      foreignKey: 'vehicleVIN',
      targetKey: 'VIN',
      as: 'vehicle'
    });
  };

  return Trailer;
};