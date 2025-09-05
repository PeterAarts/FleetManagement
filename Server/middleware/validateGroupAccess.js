import db from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';

const { Customer } = db;

export const validateGroupAccess = async (req, res, next) => {
  const loggedInCustomerId = req.user.customerId;
  const requestedGroupId = req.query.group;

  if (!requestedGroupId || requestedGroupId === '*') {
    return next();
  }

  try {
    const now = new Date();
    const groupId = requestedGroupId;

    // Try to find the join model for the customer_customer table in the models export
    const joinModel =
      db.customer_customer ||
      db.CustomerCustomer ||
      db.Customer_Customer ||
      Object.values(db).find(
        (m) => m && m.tableName === 'customer_customer'
      );

    let matchCount = 0;

    if (joinModel && typeof joinModel.count === 'function') {
      // Use the model API if available
      matchCount = await joinModel.count({
        where: {
          custId: loggedInCustomerId,
          relatedCustomerId: groupId,
          active: 1,
          created: { [Op.lte]: now },
          validUntil: { [Op.gte]: now },
        },
      });
    } else if (db.sequelize && typeof db.sequelize.query === 'function') {
      // Fallback to raw SQL if join model is not present
      const sql =
        'SELECT COUNT(*) AS cnt FROM `customer_customer` WHERE `custId` = ? AND `relatedCustomerId` = ? AND `active` = 1 AND `created` <= ? AND `validUntil` >= ?';
      const replacements = [loggedInCustomerId, groupId, now, now];

      // Ensure Sequelize returns plain SELECT results
      const rows = await db.sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
      const row = Array.isArray(rows) && rows.length ? rows[0] : rows;
      matchCount = Number(row.cnt ?? row['COUNT(*)'] ?? Object.values(row)[0] ?? 0);
    } else {
      console.error('Group access validation error: no way to query customer_customer join table');
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (matchCount > 0) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: You do not have permission to access this group.' });
  } catch (error) {
    console.error('Group access validation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};