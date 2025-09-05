import { DataTypes } from 'sequelize';

export default function(sequelize) {
  return sequelize.define('User', {
    id:               {autoIncrement: true,type: DataTypes.INTEGER,allowNull: false,primaryKey: true},
    account_id:       {type: DataTypes.INTEGER,allowNull: false,defaultValue: 0},
    email:            {type: DataTypes.STRING(155),allowNull: true},
    username:         {type: DataTypes.STRING(255),allowNull: true},
    password:         {type: DataTypes.STRING(255),allowNull: true},
    fname:            {type: DataTypes.STRING(255),allowNull: true},
    lname:            {type: DataTypes.STRING(255),allowNull: true},
    avatar:           {type: DataTypes.TINYINT,allowNull: false,defaultValue: 0},
    permissions:      {type: DataTypes.TINYINT(1),allowNull: false,defaultValue: 1,comment: "wether account is active"},
    cust_id:          {type: DataTypes.INTEGER,allowNull: false,defaultValue: 0},
    selected_cust_id: {type: DataTypes.INTEGER,allowNull: true},
    driver_id:        {type: DataTypes.STRING(16),allowNull: true},
    logins:           {type: DataTypes.INTEGER,allowNull: true},
    account_owner:    {type: DataTypes.INTEGER,allowNull: false,defaultValue: 0},
    company:          {type: DataTypes.STRING(255),allowNull: true},
    stripe_cust_id:   {type: DataTypes.STRING(255),allowNull: true},
    join_date:        {type: DataTypes.DATE,allowNull: true},
    last_login:       {type: DataTypes.DATE,allowNull: true},
    email_verified:   {type: DataTypes.TINYINT,allowNull: false,defaultValue: 0},
    last_passwordreset: {type: DataTypes.DATE,allowNull: true},
    vericode:         {type: DataTypes.TEXT,allowNull: true},
    title:            {type: DataTypes.STRING(100),allowNull: true},
    us_css:           {type: DataTypes.STRING(100),allowNull: true},
    locale:           {type: DataTypes.STRING(10),allowNull: true},
    language:         {type: DataTypes.INTEGER,allowNull: false,defaultValue: 1},
    picture:          {type: DataTypes.STRING(255),allowNull: true},
    created:          {type: DataTypes.DATE,allowNull: true},
    modified:         {type: DataTypes.DATE,allowNull: true},
    blocked:          {type: DataTypes.DATE,allowNull: true},
    un_changed:       {type: DataTypes.INTEGER(1),allowNull: true},
    profile_picture:  {type: DataTypes.BLOB,allowNull: true}
  }, {
    tableName: 'users',
    timestamps: false, // Your table uses custom date fields, not createdAt/updatedAt
    
    // Security Best Practice: Exclude the password field by default from all queries
    defaultScope: {
      attributes: { exclude: ['password', 'vericode'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      }
    }
  });
}