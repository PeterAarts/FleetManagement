import db from '../models/index.js';

export class GeofenceService {
  /**
   * Fetches the details of a single geofence definition.
   * @param {number} geofenceId - The ID of the geofence definition.
   * @param {number} customerId - The ID of the customer for security.
   * @returns {Promise<object|null>} A promise that resolves to the geofence details object or null if not found.
   */
static async getGeofenceDetails(geofenceId, customerId) {
  try {
    const query = `
      SELECT
        def.id, 
        def.name, 
        def.geojson, 
        def.type_id, 
        typ.name AS typeName
      FROM geofence_def AS def
      LEFT JOIN geofence_type AS typ ON def.type_id = typ.id
      WHERE def.id = :geofenceId AND def.customer_id = :customerId;
    `;

    const result = await db.sequelize.query(query, {
      replacements: { geofenceId, customerId },
      type: db.sequelize.QueryTypes.SELECT,
      plain: true
    });
    
    if (!result) return null;
    
    // Parse the geojson string into a proper object
    let geojson = null;
    try {
      if (typeof result.geojson === 'string' && result.geojson) {
        geojson = JSON.parse(result.geojson);
      } else if (result.geojson) {
        geojson = result.geojson;
      }
    } catch (e) {
      console.error(`[ERROR] JSON.parse failed for geofence ID ${geofenceId}:`, e.message);
    }

    const isPoi = [2, 5].includes(result.type_id);
    
    // Extract geometry from FeatureCollection or use direct geometry
    let geometry = null;
    if (geojson) {
      if (geojson.type === 'FeatureCollection' && geojson.features?.[0]?.geometry) {
        // Extract geometry from FeatureCollection
        geometry = geojson.features[0].geometry;
      } else if (geojson.type === 'Polygon' || geojson.type === 'Point') {
        // Direct geometry
        geometry = geojson;
      }
    }
    
    // Format the boundary based on geometry type
    let boundary = null;
    
    if (geometry) {
      if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
        boundary = {
          type: 'polygon',
          coordinates: geometry.coordinates[0].map(coord => ({
            lng: coord[0], // GeoJSON format is [lng, lat]
            lat: coord[1]
          }))
        };
      } else if (geometry.type === 'Point' && geometry.coordinates) {
        boundary = {
          type: 'circle',
          coordinates: {
            lng: geometry.coordinates[0],
            lat: geometry.coordinates[1]
          },
          radius: 100 // Default radius - should ideally come from geofence_reg
        };
      }
    }

    return {
      id: result.id,
      name: result.name,
      type: result.typeName,
      isPoi: isPoi,
      boundary: boundary
    };

  } catch (error) {
    console.error(`Error fetching geofence details for ID ${geofenceId}:`, error);
    throw error;
  }
}
}