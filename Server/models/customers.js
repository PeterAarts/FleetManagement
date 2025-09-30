import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Customer = sequelize.define('Customer', {
    id:                     {autoIncrement: true,type: DataTypes.INTEGER,allowNull: false,primaryKey: true},
    accountnumber:          {type: DataTypes.STRING(19),allowNull: true},
    name:                   {type: DataTypes.STRING(74),allowNull: true},
    country_id:             {type: DataTypes.INTEGER,allowNull: true},
    service_Homedealer:     {type: DataTypes.STRING(60),allowNull: true},
    serviceDescription:     {type: DataTypes.TEXT,allowNull: true},
    customerTypeId:         {type: DataTypes.INTEGER,allowNull: true,defaultValue: 1},
    dealer:                 {type: DataTypes.INTEGER,allowNull: true,defaultValue: 0},
    createdDateTime:        {type: DataTypes.DATE,allowNull: true},
    updatedDateTime:        {type: DataTypes.DATE,allowNull: true}
  }, {
    tableName: 'customers',
    timestamps: true,
    createdAt: 'createdDateTime',
    updatedAt: 'updatedDateTime',
  });

  Customer.associate = (models) => {
    // Define the association using the actual join table that exists in your database
    Customer.belongsToMany(models.Customer, {
      through: 'customer_customer',  // Just the table name as a string
      as: 'AccessibleGroups',
      foreignKey: 'custId',
      otherKey: 'relatedCustomerId',
      timestamps: false  // Disable timestamps for the through table
    });

    // Inverse relationship
    Customer.belongsToMany(models.Customer, {
      through: 'customer_customer',  // Just the table name as a string
      as: 'PermittedViewers',
      foreignKey: 'relatedCustomerId',
      otherKey: 'custId',
      timestamps: false  // Disable timestamps for the through table
    });
  };

  return Customer;
}