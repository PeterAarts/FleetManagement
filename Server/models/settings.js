import { DataTypes } from 'sequelize';

export default function(sequelize) {
  return sequelize.define('Settings', {
    id:                 { type: DataTypes.INTEGER,allowNull: false,autoIncrement: true,primaryKey: true},
    recaptcha:          { type: DataTypes.INTEGER(1), allowNull: true, defaultValue: 0 },
    domain:             { type: DataTypes.STRING(50), allowNull: true },
    customer_id:        { type: DataTypes.STRING(50), allowNull: true, defaultValue: "0" },
    site_offline:       { type: DataTypes.INTEGER(1), allowNull: true },
    site_name:          { type: DataTypes.STRING(50), allowNull: true },
    site_description:   { type: DataTypes.STRING(150), allowNull: true },
    force_ssl:          { type: DataTypes.INTEGER(1), allowNull: true, defaultValue: 1 },
    css_sample:         { type: DataTypes.INTEGER(1), allowNull: true },
    us_css:             { type: DataTypes.STRING(100), allowNull: true, defaultValue: "default_blue.css" },
    allow_user_css:     { type: DataTypes.TINYINT(1), allowNull: true, defaultValue: 0 },
    style_css:          { type: DataTypes.STRING(50), allowNull: true, defaultValue: "floating_menu.css" },
    style_menu:         { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    usersc_location:    { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    language:           { type: DataTypes.STRING(20), allowNull: true },
    track_guest:        { type: DataTypes.INTEGER(1), allowNull: true },
    force_pr:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    reserved1:          { type: DataTypes.STRING(100), allowNull: true },
    reserved2:          { type: DataTypes.STRING(100), allowNull: true },
    custom1:            { type: DataTypes.STRING(100), allowNull: true },
    daysStatistics: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    DashboardVC: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    DashBoardType: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    graph_ver: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    finalredir: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    req_cap: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    req_num: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    min_pw: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_pw: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    min_un: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_un: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_pwa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 90
    },
    emailpwa: {
      type: DataTypes.TINYINT(1),
      allowNull: true
    },
    frocepwr: { // Note: Matches the typo in your schema
      type: DataTypes.TINYINT(1),
      allowNull: true
    },
    messaging: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    snooping: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    echouser: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    wys: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    change_un: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    FooterText: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    FooterActive: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    Minimum_trip_distance: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    ExcessiveIdling: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    SpeedingThreshold: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    loginPhrase: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    licensed: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    version: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    reporting_enabled: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    reporting_adaptiveDates: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    report_description: {
      type: DataTypes.CHAR(120),
      allowNull: true
    },
    report_logo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pdc_enabled: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    pdc_reporting: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    pdc_autoprocess: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    sioc: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    timeZone: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "Europe/Amsterdam"
    },
    tag_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    enableAccountSharing: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    adaptiveAccountSharing: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    availableForServices: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    serviceDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'settings',
    timestamps: false // Your table doesn't have createdAt/updatedAt columns
  });
}