import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const GeofenceReg = sequelize.define('GeofenceReg', {
    id:                   {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true,allowNull: false,comment: 'geofence id'},
    vin:                  {type: DataTypes.STRING(17)},
    geofence_id:          {type: DataTypes.INTEGER},
    customerId:           {type: DataTypes.INTEGER},
    prio:                 {type: DataTypes.CHAR(50)},
    type:                 {type: DataTypes.CHAR(50)},
    registration:         {type: DataTypes.CHAR(50)},
    range:                {type: DataTypes.INTEGER,defaultValue: 200,comment: 'range in meters'},
    alert:                {type: DataTypes.CHAR(50)},
    createTrigger:        {type: DataTypes.TINYINT,allowNull: false,defaultValue: 0},
    type:                 {type: DataTypes.TINYINT,allowNull: false,defaultValue: 0},
    latitude:             {type: DataTypes.DECIMAL(15, 9)},
    longitude:            {type: DataTypes.DECIMAL(15, 9)},
    status:               {type: DataTypes.CHAR(50),defaultValue: 'new'},
    createdDateTime:      {type: DataTypes.DATE,defaultValue: DataTypes.NOW},
    lastUpdated:          {type: DataTypes.DATE,defaultValue: DataTypes.NOW}
  }, {
    tableName: 'geofence_reg',
    timestamps: false // We use the table's own timestamp columns
  });

  GeofenceReg.associate = (models) => {
    // Defines the relationship, stating that a GeofenceReg record belongs to one Vehicle
    GeofenceReg.belongsTo(models.Vehicle, { foreignKey: 'vin', targetKey: 'VIN' });
  };

  return GeofenceReg;
}