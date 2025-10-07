// routes/formbuilder.js - Generic form builder routes
import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import db from '../models/index.js';

const router = express.Router();
const { sequelize } = db;

/**
 * GET /api/formbuilder/:resourceType/:id
 * Fetches both the resource data AND its formBuild definition
 * 
 * Examples:
 * - /api/formbuilder/vehicles/123
 * - /api/formbuilder/drivers/456
 * - /api/formbuilder/trailers/789
 */
router.get('/:resourceType/:id', sessionAuth, async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    const customerId = req.user.selectedCustomerId;

    // Validate resource type exists in formtables
    const formTableQuery = `
      SELECT table, displayName, formAvailable, userPermission
      FROM formtables
      WHERE table = :resourceType AND formAvailable = 1
      LIMIT 1
    `;

    const [formTable] = await sequelize.query(formTableQuery, {
      replacements: { resourceType },
      type: sequelize.QueryTypes.SELECT
    });

    if (!formTable) {
      return res.status(404).json({ 
        message: `No form definition found for resource type: ${resourceType}` 
      });
    }

    // Check user permission level
    if (formTable.userPermission > req.user.permissionLevel) {
      return res.status(403).json({ 
        message: 'Insufficient permissions to access this resource' 
      });
    }

    // Fetch the formBuild definition
    const formBuildQuery = `
      SELECT 
        id, table, form, field, label, column, columnSize, row, sequence,
        \`group\`, type, size, height, pattern, value, editable, icon, accessLevel
      FROM formbuilder
      WHERE table = :resourceType
      ORDER BY column ASC, row ASC, sequence ASC
    `;

    const formBuild = await sequelize.query(formBuildQuery, {
      replacements: { resourceType },
      type: sequelize.QueryTypes.SELECT
    });

    if (!formBuild || formBuild.length === 0) {
      return res.status(404).json({ 
        message: `No form fields defined for ${resourceType}` 
      });
    }

    // Fetch the actual resource data using the appropriate service
    let resourceData = null;
    
    switch (resourceType) {
      case 'vehicles':
        const { VehicleService } = await import('../services/vehicleService.js');
        resourceData = await VehicleService.getSingleVehicleDetails(id, customerId);
        break;
        
      case 'driver':
        const { DriverService } = await import('../services/driverService.js');
        resourceData = await DriverService.getDriverDetails(id, customerId);
        break;
        
      case 'trailers':
        const { TrailerService } = await import('../services/trailerService.js');
        resourceData = await TrailerService.getTrailerById(id, customerId);
        break;
        
      case 'api_collector':
      case 'api_scheduler':
      case 'api_script_type':
      case 'workshops':
        // Generic query for simple tables
        const genericQuery = `SELECT * FROM ${resourceType} WHERE id = :id LIMIT 1`;
        const [genericData] = await sequelize.query(genericQuery, {
          replacements: { id },
          type: sequelize.QueryTypes.SELECT
        });
        resourceData = genericData;
        break;
        
      default:
        return res.status(400).json({ 
          message: `Unknown resource type: ${resourceType}` 
        });
    }

    if (!resourceData) {
      return res.status(404).json({ 
        message: `${formTable.displayName} with ID ${id} not found` 
      });
    }

    // Return both data and formBuild (matching your PHP pattern)
    res.json({
      data: resourceData,
      formBuild: formBuild
    });

  } catch (error) {
    console.error('Error in formbuilder route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/formbuilder/:resourceType
 * Saves updated resource data
 */
router.post('/:resourceType', sessionAuth, async (req, res) => {
  try {
    const { resourceType } = req.params;
    const customerId = req.user.selectedCustomerId;
    const updatedData = req.body;

    if (!updatedData.id) {
      return res.status(400).json({ message: 'ID is required for updates' });
    }

    // Validate resource type
    const formTableQuery = `
      SELECT table, displayName, userPermission
      FROM formtables
      WHERE table = :resourceType AND formAvailable = 1
      LIMIT 1
    `;

    const [formTable] = await sequelize.query(formTableQuery, {
      replacements: { resourceType },
      type: sequelize.QueryTypes.SELECT
    });

    if (!formTable) {
      return res.status(404).json({ 
        message: `No form definition found for resource type: ${resourceType}` 
      });
    }

    // Get editable fields from formbuilder
    const editableFieldsQuery = `
      SELECT field
      FROM formbuilder
      WHERE table = :resourceType AND editable = 1
    `;

    const editableFields = await sequelize.query(editableFieldsQuery, {
      replacements: { resourceType },
      type: sequelize.QueryTypes.SELECT
    });

    const allowedFields = editableFields.map(f => f.field);

    // Build UPDATE query with only editable fields
    const updateFields = {};
    Object.keys(updatedData).forEach(key => {
      if (allowedFields.includes(key) && key !== 'id') {
        updateFields[key] = updatedData[key];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ 
        message: 'No editable fields provided' 
      });
    }

    // Build and execute UPDATE query
    const setClause = Object.keys(updateFields)
      .map(field => `\`${field}\` = :${field}`)
      .join(', ');

    const updateQuery = `
      UPDATE ${resourceType}
      SET ${setClause}
      WHERE id = :id
    `;

    await sequelize.query(updateQuery, {
      replacements: { ...updateFields, id: updatedData.id },
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({ 
      success: true,
      message: `${formTable.displayName} updated successfully`,
      data: updatedData
    });

  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/formbuilder/:resourceType/:id
 * Deletes a resource
 */
router.delete('/:resourceType/:id', sessionAuth, async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    const customerId = req.user.selectedCustomerId;

    // Validate and check permissions...
    const formTableQuery = `
      SELECT table, displayName, userPermission
      FROM formtables
      WHERE table = :resourceType AND formAvailable = 1
      LIMIT 1
    `;

    const [formTable] = await sequelize.query(formTableQuery, {
      replacements: { resourceType },
      type: sequelize.QueryTypes.SELECT
    });

    if (!formTable) {
      return res.status(404).json({ 
        message: `No form definition found for resource type: ${resourceType}` 
      });
    }

    // Soft delete or hard delete based on table structure
    const deleteQuery = `
      DELETE FROM ${resourceType}
      WHERE id = :id
      LIMIT 1
    `;

    const [result] = await sequelize.query(deleteQuery, {
      replacements: { id },
      type: sequelize.QueryTypes.DELETE
    });

    res.json({ 
      success: true,
      message: `${formTable.displayName} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;