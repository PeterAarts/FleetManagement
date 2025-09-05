import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Driver = sequelize.define('Driver', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tachoDriverIdentification: { type: DataTypes.STRING(16), unique: true },
    CurrentStatus: { type: DataTypes.STRING(26) },
    LastVehicle: { type: DataTypes.STRING(19) },
    LastDriverActivity: { type: DataTypes.DATE },
    Surname: { type: DataTypes.STRING(64) },
    Lastname: { type: DataTypes.STRING(64) },
    driverName: {
      type: DataTypes.VIRTUAL,
      get() {
        const lastname = this.getDataValue('Lastname');
        const surname = this.getDataValue('Surname');
        if (lastname) {
          return `${lastname}, ${surname}`;
        }
        return this.getDataValue('tachoDriverIdentification');
      }
    }
    // Add other fields from your table as needed
  }, { tableName: 'driver', timestamps: false });

  Driver.associate = (models) => {
    Driver.hasMany(models.Drivetime, { foreignKey: 'driverId', sourceKey: 'tachoDriverIdentification' });
  };

  return Driver;
}