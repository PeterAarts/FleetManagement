import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Trailer = sequelize.define('Trailer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    trailerName: { type: DataTypes.CHAR(28) },
    vehicleVIN: { type: DataTypes.STRING(17) },
    copplingStatus: { type: DataTypes.TINYINT },
  }, { tableName: 'trailers', timestamps: false });

  Trailer.associate = (models) => {
    Trailer.belongsTo(models.Vehicle, { foreignKey: 'vehicleVIN', targetKey: 'VIN' });
  };

  return Trailer;
}