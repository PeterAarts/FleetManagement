// config/modalConfigs.js
// Minimal configs - formBuild comes from database!

export const vehicleModalConfig = {
  formTitle: [
    { id: 'name', field: 'customerVehicleName', icon: 'fa-light fa-truck fa-fw text-gray-500', class: 'text-xl font-bold uppercase text-gray-600' },
    { id: 'trailer', field: 'trailerName', icon: 'fa-light fa-trailer fa-fw text-gray-500', class: 'h3' },
    { id: 'lastActivity', field: 'lastActivity', icon: 'fa-light fa-clock fa-fw text-gray-500', class: 'h3' },
  ],
  formTabs: [
    { id: 'Maintenance', label: '', icon: 'fa-light fa-wrench fa-fw', tooltip: 'Maintenance', onClick: 'ShowVehicleMaintenanceStatus', target: 'div' },
    { id: 'tableVehicleActivity', label: '', icon: 'fa-light fa-user-clock fa-fw', tooltip: 'Driver Activity', onClick: 'ShowVehicleActivity', target: 'table' },
    { id: 'tableVehicleTrips', label: '', icon: 'fa-light fa-route fa-fw', tooltip: 'Vehicle Trips', onClick: 'ShowVehicleTrips', target: 'table' },
    { id: 'VehicleDamage', label: '', icon: 'fa-light fa-tools fa-fw', tooltip: 'Damages', onClick: 'ShowVehicleRD', target: 'table' },
    { id: 'tabVehicleTrailer', label: '', icon: 'fa-light fa-trailer fa-fw', tooltip: 'Trailer', onClick: 'ShowVehicleTrailer', target: 'div' },
    { id: 'tabTPMS', label: '', icon: 'fa-light fa-tire-pressure-warning fa-fw', tooltip: 'TPMS', onClick: 'ShowTPMS', target: 'div' },
    { id: 'tableVehicleGeofences', label: '', icon: 'fa-light fa-draw-polygon fa-fw', tooltip: 'Geofences', onClick: 'ShowVehicleGeofences', target: 'table' }
  ]
};

export const driverModalConfig = {
  formTitle: [
    { id: 'name', field: 'fullName', icon: 'fa-light fa-user fa-fw', class: 'h3' },
    { id: 'license', field: 'tachoDriverIdentification', icon: 'fa-light fa-id-card fa-fw', class: 'normal' },
  ],
  formTabs: [
    { id: 'driverActivity', label: '', icon: 'fa-light fa-clock fa-fw', tooltip: 'Activity History', onClick: 'ShowDriverActivity', target: 'table' },
    { id: 'driverViolations', label: '', icon: 'fa-light fa-triangle-exclamation fa-fw', tooltip: 'Violations', onClick: 'ShowDriverViolations', target: 'table' },
    { id: 'driverTrips', label: '', icon: 'fa-light fa-route fa-fw', tooltip: 'Trip History', onClick: 'ShowDriverTrips', target: 'table' },
  ]
};

export const trailerModalConfig = {
  formTitle: [
    { id: 'name', field: 'trailerName', icon: 'fa-light fa-trailer fa-fw', class: 'h3' },
    { id: 'vin', field: 'vin', icon: 'fa-light fa-barcode fa-fw', class: 'normal' },
  ],
  formTabs: [
    { id: 'trailerMaintenance', label: '', icon: 'fa-light fa-wrench fa-fw', tooltip: 'Maintenance', onClick: 'ShowTrailerMaintenance', target: 'div' },
    { id: 'trailerHistory', label: '', icon: 'fa-light fa-clock fa-fw', tooltip: 'Usage History', onClick: 'ShowTrailerHistory', target: 'table' },
  ]
};

export const workshopModalConfig = {
  formTitle: [
    { id: 'name', field: 'name', icon: 'fa-light fa-wrench fa-fw', class: 'h3' },
    { id: 'code', field: 'code', icon: 'fa-light fa-barcode fa-fw', class: 'normal' },
  ],
  formTabs: []
};

export const apiCollectorModalConfig = {
  formTitle: [
    { id: 'name', field: 'name', icon: 'fa-light fa-plug fa-fw', class: 'h3' },
    { id: 'vendor', field: 'vendor', icon: 'fa-light fa-building fa-fw', class: 'normal' },
  ],
  formTabs: []
};

export const apiSchedulerModalConfig = {
  formTitle: [
    { id: 'name', field: 'name_EndPoint', icon: 'fa-light fa-calendar fa-fw', class: 'h3' },
    { id: 'lastExecution', field: 'lastExecution', icon: 'fa-light fa-clock fa-fw', class: 'normal' },
  ],
  formTabs: []
};

export default {
  vehicles: vehicleModalConfig,
  driver: driverModalConfig,
  trailers: trailerModalConfig,
  workshops: workshopModalConfig,
  api_collector: apiCollectorModalConfig,
  api_scheduler: apiSchedulerModalConfig,
};