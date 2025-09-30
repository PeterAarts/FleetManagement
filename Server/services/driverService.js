// services/driverService.js
import db from '../models/index.js';
import { Op } from 'sequelize';

const { sequelize } = db;

/**
 * Convert time string (HH:MM:SS) to seconds
 */
const timeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
};

/**
 * Convert seconds to time string (HH:MM:SS)
 */
const secondsToTime = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Get the week number for a given date (ISO week)
 */
const getISOWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export class DriverService {
  
  /**
   * Get driver details with drive time calculations
   * @param {number} driverId - Driver ID (from vehicle data)
   * @param {number} customerId - Customer ID from session
   */
  static async getDriverDetails(driverId, customerId) {
    try {
      // First, get the drive time rules/settings
      const settingsQuery = `
        SELECT 
          id,
          settings_id,
          title,
          description,
          standardDailyDriveTime,
          maxDriveTimeToRestDaily,
          extendedDriveTime,
          maxDriveTimeBiWeekly,
          maxDriveTimeWeekly,
          countExtendedDriveTimeWeekly,
          countExtendedDriveTimeBiWeekly,
          consecutiveDaysBeforeRest,
          countShortRestWeekly,
          minRestBetweenDriveDaily,
          minRestPeriodWeekly,
          minRestPeriodBiWeekly,
          maxWorkingWeekly,
          maxWorkingPeriod,
          maxWorkingAverageinPeriod,
          workingBreakTimeIncrement,
          firstBreakWorkTime,
          firstBreakWorkTimeDuration,
          secondBreakWorkTime,
          secondBreakWorkTimeDuration
        FROM settings_drivetime 
        WHERE settings_id = (
          SELECT id FROM settings WHERE customer_id = :customerId LIMIT 1
        )
      `;
      
      const [settingsResults] = await sequelize.query(settingsQuery, {
        replacements: { customerId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!settingsResults) {
        throw new Error('Drive time settings not found for customer');
      }

      const driveTimeRules = settingsResults;

      // Now get the driver information with drive time statistics
      // This query mirrors the PHP implementation with CTE for efficiency
      const driverQuery = `
        WITH DriverStats AS (
          SELECT
            dt.driverId,
            -- Drive time calculations using precise week definitions
            SUM(IF(dt.DriveDate = CURDATE(), dt.drive, 0)) AS DriveToday,
            SUM(IF(YEARWEEK(dt.DriveDate, 1) = YEARWEEK(CURDATE(), 1), dt.drive, 0)) AS ThisWeekDrive,
            SUM(IF(YEARWEEK(dt.DriveDate, 1) = YEARWEEK(CURDATE(), 1) - 1, dt.drive, 0)) AS LastWeekDrive,
            
            -- Counts of special events for the current week
            COUNT(DISTINCT IF(
              YEARWEEK(dt.DriveDate, 1) = YEARWEEK(CURDATE(), 1) 
              AND dt.drive > :standardDailyDrive, 
              dt.DriveDate, NULL
            )) AS UsedExtendedDriveThisWeek,
            
            COUNT(DISTINCT IF(
              YEARWEEK(dt.DriveDate, 1) = YEARWEEK(CURDATE(), 1) 
              AND (86400 - dt.drive - dt.work - dt.available) < :minRestDaily, 
              dt.DriveDate, NULL
            )) AS UsedShortRestThisWeek,
            
            -- Count of working days for the current week
            COUNT(DISTINCT IF(
              YEARWEEK(dt.DriveDate, 1) = YEARWEEK(CURDATE(), 1) 
              AND dt.drive > 0, 
              dt.DriveDate, NULL
            )) AS WorkingDaysThisWeek
          FROM drivetimes dt
          WHERE
            dt.driverId = :driverId
            AND dt.DriveDate >= (CURDATE() - INTERVAL (DAYOFWEEK(CURDATE() - INTERVAL 1 DAY) + 7) DAY)
          GROUP BY dt.driverId
        )
        SELECT
          d.id,
          d.tachoDriverIdentification,
          d.Surname,
          d.Lastname,
          d.eMail as email,
          d.Phone_Mobile as Mobile, 
          IF(
            d.Lastname IS NULL OR d.Lastname='', 
            d.tachoDriverIdentification, 
            CONCAT(d.Lastname, ', ', d.Surname)
          ) AS fullName,
          d.LastVehicle,
          v.customerVehicleName AS LastVehicleName,
          ROUND(v.odometer / 1000, 0) AS odometer,
          t.trailerName AS TrailerName,
          t.vin AS TrailerVin,
          
          -- Drive time stats
          IFNULL(ds.DriveToday, 0) AS DriveToday,
          IFNULL(ds.ThisWeekDrive, 0) AS ThisWeekDrive,
          IFNULL(ds.LastWeekDrive, 0) AS LastWeekDrive,
          IFNULL(ds.ThisWeekDrive, 0) + IFNULL(ds.LastWeekDrive, 0) AS BiWeeklyDrive,
          IFNULL(ds.UsedExtendedDriveThisWeek, 0) AS UsedExtendedDriveThisWeek,
          IFNULL(ds.UsedShortRestThisWeek, 0) AS UsedShortRestThisWeek,
          IFNULL(ds.WorkingDaysThisWeek, 0) AS WorkingDaysThisWeek
        FROM driver d
        LEFT JOIN vehicles v ON d.LastVehicle = v.VIN
        LEFT JOIN trailers t ON d.LastVehicle = t.vehicleVIN AND t.copplingStatus = 1
        LEFT JOIN DriverStats ds ON d.id = :driverId
        WHERE d.id = :driverId
      `;

      const [driverResults] = await sequelize.query(driverQuery, {
        replacements: { 
          driverId,
          standardDailyDrive: driveTimeRules.standardDailyDriveTime,
          minRestDaily: driveTimeRules.minRestBetweenDriveDaily
        },
        type: sequelize.QueryTypes.SELECT
      });

      if (!driverResults) {
        return null;
      }

      // Calculate infringements and remaining drive times
      const calculations = this.calculateDriveTimes(driverResults, driveTimeRules);
      
      // Combine all data for the response
      return {
        // Driver info
        id: driverResults.id,
        fullName: driverResults.fullName,
        email: driverResults.email,
        mobile: driverResults.Mobile, // This line was already here and now receives data
        tachoDriverIdentification: driverResults.tachoDriverIdentification,
        
        // Vehicle info
        lastVehicle: driverResults.LastVehicle,
        lastVehicleName: driverResults.LastVehicleName || 'No vehicle',
        odometer: driverResults.odometer,
        trailerName: driverResults.TrailerName || 'No trailer',
        trailerVin: driverResults.TrailerVin || 'N/A',
        
        // --- UPDATED SECTION ---
        // These fields now show the REMAINING drive time allowance.
        driveToday: secondsToTime(calculations.remainingDriveToday),
        driveWeekly: secondsToTime(calculations.remainingDriveWeekly),
        driveBiWeekly: secondsToTime(calculations.remainingDriveBiWeekly),
        
        // Also update the raw second values to reflect remaining time.
        driveTodaySeconds: calculations.remainingDriveToday,
        driveWeeklySeconds: calculations.remainingDriveWeekly,
        driveBiWeeklySeconds: calculations.remainingDriveBiWeekly,
        // --- END UPDATED SECTION ---

        // We'll keep the original remaining time fields for backward compatibility, though they are now redundant.
        remainingDriveToday: secondsToTime(calculations.remainingDriveToday),
        remainingDriveWeekly: secondsToTime(calculations.remainingDriveWeekly),
        remainingDriveBiWeekly: secondsToTime(calculations.remainingDriveBiWeekly),

        // Limits (in seconds for progress calculations)
        maxDriveTodaySeconds: calculations.maxDriveTimeToday,
        maxDriveWeeklySeconds: calculations.thisWeekMaxDriveTime,
        maxDriveBiWeeklySeconds: driveTimeRules.maxDriveTimeBiWeekly,
        
        // Usage counts
        extendedHoursUsed: driverResults.UsedExtendedDriveThisWeek,
        extendedHoursAvailable: driveTimeRules.countExtendedDriveTimeWeekly,
        shortRestsUsed: driverResults.UsedShortRestThisWeek,
        shortRestsAvailable: driveTimeRules.countShortRestWeekly,
        workingDays: driverResults.WorkingDaysThisWeek,
        maxConsecutiveDays: driveTimeRules.consecutiveDaysBeforeRest,
        
        // Status
        infringements: calculations.infringements,
        hasInfringements: calculations.infringements > 0,
        
        // Keep original used time for reference if needed elsewhere
        usedTime: {
            today: secondsToTime(driverResults.DriveToday),
            weekly: secondsToTime(driverResults.ThisWeekDrive),
            biWeekly: secondsToTime(driverResults.BiWeeklyDrive),
            lastWeek: secondsToTime(driverResults.LastWeekDrive)
        },
        
        // Rules (for frontend reference if needed)
        rules: {
          standardDailyDrive: secondsToTime(driveTimeRules.standardDailyDriveTime),
          extendedDailyDrive: secondsToTime(driveTimeRules.extendedDriveTime),
          maxWeeklyDrive: secondsToTime(driveTimeRules.maxDriveTimeWeekly),
          maxBiWeeklyDrive: secondsToTime(driveTimeRules.maxDriveTimeBiWeekly)
        }
      };
      
    } catch (error) {
      console.error('Error fetching driver details:', error);
      throw error;
    }
  }

  /**
   * Calculate remaining drive times and infringements
   */
  static calculateDriveTimes(driverData, rules) {
    const maxDriveBiWeekly = rules.maxDriveTimeBiWeekly;
    const maxDriveWeekly = rules.maxDriveTimeWeekly;
    const standardDailyDrive = rules.standardDailyDriveTime;
    const extendedDailyDrive = rules.extendedDriveTime;
    
    let infringements = 0;
    
    // Check bi-weekly infringement
    if (driverData.BiWeeklyDrive > maxDriveBiWeekly) {
      infringements++;
    }
    
    // Check last week infringement
    if (driverData.LastWeekDrive > maxDriveWeekly) {
      infringements++;
    }
    
    // Determine max drive time for today
    let maxDriveTimeToday;
    if (driverData.UsedExtendedDriveThisWeek < rules.countExtendedDriveTimeWeekly) {
      maxDriveTimeToday = extendedDailyDrive;
    } else {
      maxDriveTimeToday = standardDailyDrive;
    }
    
    // Check today's infringement
    if (driverData.DriveToday > maxDriveTimeToday) {
      infringements++;
    }
    
    // Calculate this week's maximum allowed drive time
    let thisWeekMaxDriveTime = maxDriveWeekly;
    const remainingBiWeekly = maxDriveBiWeekly - driverData.LastWeekDrive;
    if (remainingBiWeekly < thisWeekMaxDriveTime) {
      thisWeekMaxDriveTime = remainingBiWeekly;
    }
    
    // Check this week's infringement
    if (driverData.ThisWeekDrive > thisWeekMaxDriveTime) {
      infringements++;
    }
    
    // Calculate remaining times
    const remainingDriveToday = Math.max(0, maxDriveTimeToday - driverData.DriveToday);
    const remainingDriveWeekly = Math.max(0, thisWeekMaxDriveTime - driverData.ThisWeekDrive);
    const remainingDriveBiWeekly = Math.max(0, maxDriveBiWeekly - driverData.BiWeeklyDrive);
    
    return {
      infringements,
      maxDriveTimeToday,
      thisWeekMaxDriveTime,
      remainingDriveToday,
      remainingDriveWeekly,
      remainingDriveBiWeekly
    };
  }

  /**
   * Get multiple drivers' basic info (for vehicle detail page)
   */
  static async getDriversBasicInfo(driverIds, customerId) {
    if (!driverIds || driverIds.length === 0) return [];
    
    try {
      const query = `
        SELECT 
          d.id,
          d.tachoDriverIdentification,
          IF(
            d.Lastname IS NULL OR d.Lastname='', 
            d.tachoDriverIdentification, 
            CONCAT(d.Lastname, ', ', d.Surname)
          ) AS fullName,
          d.eMail as email,
          d.Phone_Mobile as Mobile
        FROM driver d
        WHERE d.id IN (:driverIds)
      `;
      
      const drivers = await sequelize.query(query, {
        replacements: { driverIds },
        type: sequelize.QueryTypes.SELECT
      });
      
      return drivers;
    } catch (error) {
      console.error('Error fetching drivers basic info:', error);
      return [];
    }
  }
}