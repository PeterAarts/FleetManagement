// src/routes/dashboard.js

import express from 'express';
import db from '../models/index.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { QueryTypes } from 'sequelize';

const router = express.Router();
const { sequelize } = db;

router.get('/', isAuthenticated, async (req, res) => {
  // Use a default of 14 days, consistent with many dashboards
  const days = parseInt(req.query.days, 10) || 14;
  // In a multi-tenant app, you'd get this from the authenticated user
  const { customerId } = req.user;

  try {
    // --- Query 1: Advanced Statistics with Trend Calculation ---
    // This query is adapted from your PHP script to calculate percentage changes.
    const statisticsQuery = `
      WITH LastDays AS (
        SELECT
          COUNT(*) AS total_trips,
          SUM(t.Distance) AS total_distance,
          SUM(t.FuelUsed) AS total_fuel_used,
          AVG(t.FuelUsed / t.Distance * 100) AS avg_fuel_usage,
          (SUM(t.FuelUsed) * 2.67 / 1000) AS total_co2_emission,
          COUNT(DISTINCT t.VIN) AS active_vehicles
        FROM trips t
          LEFT JOIN customer_vehicle cv ON cv.vehicleVin = t.VIN
          LEFT JOIN customer_customer cc ON cc.relatedCustomerId = cv.custId
        WHERE
          t.StartDate >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
          AND cc.custId = :customerId AND cv.active = true AND t.Distance > 1
      ),
      PreviousDays AS (
        SELECT
          COUNT(*) AS total_trips,
          SUM(t.Distance) AS total_distance,
          SUM(t.FuelUsed) AS total_fuel_used,
          AVG(t.FuelUsed / t.Distance * 100) AS avg_fuel_usage,
          (SUM(t.FuelUsed) * 2.67 / 1000) AS total_co2_emission,
          COUNT(DISTINCT t.VIN) AS active_vehicles
        FROM trips t
          LEFT JOIN customer_vehicle cv ON cv.vehicleVin = t.VIN
          LEFT JOIN customer_customer cc ON cc.relatedCustomerId = cv.custId
        WHERE
          t.StartDate >= DATE_SUB(CURDATE(), INTERVAL (:days * 2) DAY)
          AND t.StartDate < DATE_SUB(CURDATE(), INTERVAL :days DAY)
          AND cc.custId = :customerId AND cv.active = true AND t.Distance > 1
      )
      SELECT
        -- Daily Averages for the last period
        ld.total_trips / :days AS trips,
        ld.total_distance / :days AS distance,
        ld.total_fuel_used / :days AS fuelUsed,
        ld.avg_fuel_usage AS fuelUsage,
        ld.total_co2_emission / :days AS co2,
        ld.active_vehicles / :days AS vehiclesActive,
        -- Percentage Change Calculation
        ( (ld.total_trips / :days) - (pd.total_trips / :days) ) / NULLIF(pd.total_trips / :days, 0) * 100 AS tripsChange,
        ( (ld.total_distance / :days) - (pd.total_distance / :days) ) / NULLIF(pd.total_distance / :days, 0) * 100 AS distanceChange,
        ( (ld.total_fuel_used / :days) - (pd.total_fuel_used / :days) ) / NULLIF(pd.total_fuel_used / :days, 0) * 100 AS fuelUsedChange,
        ( ld.avg_fuel_usage - pd.avg_fuel_usage ) / NULLIF(pd.avg_fuel_usage, 0) * 100 AS fuelUsageChange,
        ( (ld.total_co2_emission / :days) - (pd.total_co2_emission / :days) ) / NULLIF(pd.total_co2_emission / :days, 0) * 100 AS co2Change,
        ( (ld.active_vehicles / :days) - (pd.active_vehicles / :days) ) / NULLIF(pd.active_vehicles / :days, 0) * 100 AS vehiclesActiveChange
      FROM LastDays ld, PreviousDays pd;
    `;

    // --- Query 2: Data for the Daily Trend Chart (largely unchanged) ---
    const trendQuery = `
      SELECT
  DATE(startDate) AS trip_date,
  COUNT(DISTINCT t.VIN) AS vehicles_driving,
  COUNT(*) AS total_trips,
  SUM(distance) AS total_distance,
  AVG(fuelusage) AS avg_fuelusage,
  SUM(fuelused) AS total_fuelused,
  (SUM(fuelUsed) * 2.67 / 1000) AS total_co2_emission
FROM trips t
  LEFT JOIN customer_vehicle cv ON cv.vehicleVin = t.VIN
  LEFT JOIN customer_customer cc ON cc.relatedCustomerId = cv.custId
WHERE
  startDate >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
  AND cv.active = true
  AND cc.custId = :customerId
GROUP BY trip_date
ORDER BY trip_date ASC;
    `;

    // Run both queries concurrently for maximum performance
    const [statisticsResults, trendResults] = await Promise.all([
      sequelize.query(statisticsQuery, {
        replacements: { customerId: customerId, days: days },
        type: QueryTypes.SELECT
      }),
      sequelize.query(trendQuery, {
        replacements: { customerId: customerId, days: days },
        type: QueryTypes.SELECT
      })
    ]);

    // Structure the final response to match the frontend's needs
    res.json({
      // The statistics query returns a single row with all KPIs and their changes
      statistics: statisticsResults[0],
      // The trend query returns an array of daily data points for the chart
      trends: trendResults
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;