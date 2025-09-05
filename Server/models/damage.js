import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Damage = sequelize.define('Damage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vin: { type: DataTypes.STRING(17) },
    repairStatus: { type: DataTypes.INTEGER },
    severity: { type: DataTypes.INTEGER },
  }, { tableName: 'pdc_damage', timestamps: false });

  Damage.associate = (models) => {
    Damage.belongsTo(models.Vehicle, { foreignKey: 'vin', targetKey: 'VIN' });
  };

  return Damage;
}