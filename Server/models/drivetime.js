import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Drivetime = sequelize.define('Drivetime', {
    driverId: { type: DataTypes.STRING(16) },
    DriveDate: { type: DataTypes.DATEONLY },
    drive: { type: DataTypes.INTEGER },
    // Add other fields as needed
  }, { tableName: 'drivetimes', timestamps: false, primaryKey: ['driverId', 'DriveDate'] });

  return Drivetime;
}