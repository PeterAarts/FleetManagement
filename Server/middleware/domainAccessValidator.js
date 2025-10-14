// ============================================
// FILE: middleware/domainAccessValidator.js
// ============================================
import db from '../models/index.js';
import { QueryTypes } from 'sequelize';

const { Settings, sequelize } = db;

/**
 * Extract frontend domain from request headers
 */
export function extractDomain(req) {
  const origin = req.get('origin') || req.get('referer');
  
  if (origin) {
    try {
      const url = new URL(origin);
      return url.hostname;
    } catch (e) {
 //     console.warn('Could not parse origin:', origin);
      return 'localhost';
    }
  }
  
  return 'localhost';
}

/**
 * Check if user is a super admin
 * Super admin = custId is NULL/empty AND has permission_id < 10
 */
export async function isSuperAdmin(userId, userCustomerId) {
  // Check if custId is empty
  const isSuperAdminUser = (
    userCustomerId === null || 
    userCustomerId === undefined || 
    userCustomerId === ''
  );
  
  if (!isSuperAdminUser) {
    return false;
  }
  
  // Check if user has permission_id < 10
  const superAdminCheck = await sequelize.query(`
    SELECT COUNT(*) as count
    FROM user_permission_matches
    WHERE user_id = :userId AND permission_id < 10
  `, {
    replacements: { userId: userId },
    type: QueryTypes.SELECT
  });
  
  return superAdminCheck[0]?.count > 0;
}

/**
 * Validate if user has access to a specific domain
 * Returns: { hasAccess: boolean, reason: string, settings: object|null }
 */
export async function validateDomainAccess(userId, userCustomerId, frontendDomain) {
//  console.log('=== DOMAIN ACCESS VALIDATION ===');
//  console.log('Domain:', frontendDomain);
//  console.log('User ID:', userId);
//  console.log('User customer:', userCustomerId, '(type:', typeof userCustomerId, ')');
  
  // Find settings for this domain
  const settings = await Settings.findOne({
    where: { domain: frontendDomain }
  });

  if (!settings) {
 //   console.warn('No settings found for domain:', frontendDomain);
    
    // In development, allow without settings
    if (process.env.NODE_ENV !== 'production') {
 //     console.warn('Development mode: Allowing without domain settings');
      return {
        hasAccess: true,
        reason: 'Development mode',
        settings: null
      };
    }
    
    return {
      hasAccess: false,
      reason: 'Domain not configured',
      settings: null
    };
  }

  /*console.log('Found settings:', {
    domain: settings.domain,
    customer_id: settings.customer_id,
    site_name: settings.site_name
  });*/

  const domainCustomerId = settings.customer_id;
  
  //console.log('Domain customer:', domainCustomerId, '(type:', typeof domainCustomerId, ')');
  
  // Check if user is super admin
  const isUserSuperAdmin = await isSuperAdmin(userId, userCustomerId);
  
  // Check if user's customer matches domain's customer (type-safe comparison)
  const hasDirectAccess = Number(userCustomerId) === Number(domainCustomerId);
  
  /*console.log('Access check:', {
    isSuperAdmin: isUserSuperAdmin,
    hasDirectAccess: hasDirectAccess,
    comparison: `${Number(userCustomerId)} === ${Number(domainCustomerId)}`
  });*/
  
  // Grant access if super admin OR direct customer match
  if (isUserSuperAdmin) {
  //  console.log('✓ Access granted: Super Admin');
    return {
      hasAccess: true,
      reason: 'Super Admin',
      settings: settings
    };
  }
  
  if (hasDirectAccess) {
  //  console.log('✓ Access granted: Direct customer match');
    return {
      hasAccess: true,
      reason: 'Customer match',
      settings: settings
    };
  }
  
  //console.warn(`❌ Access DENIED: User ${userId} (customer ${userCustomerId}) cannot access domain ${frontendDomain} (customer ${domainCustomerId})`);
  
  return {
    hasAccess: false,
    reason: 'User customer does not match domain customer',
    settings: settings
  };
}