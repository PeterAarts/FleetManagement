import db from '../db.js';

export const tenantIdentifier = async (req, res, next) => {
  // Get the origin header from the request (e.g., 'https://demo.rfmsconnect.nl')
  const origin = req.headers.origin;

  if (!origin) {
    // If there's no origin header, we can't identify the tenant.
    // This can happen with direct API calls (like from Postman) or server-to-server requests.
    // You can decide how to handle this. For now, we'll allow it to proceed.
    return next();
  }

  try {
    // The origin includes the protocol (https://). We need to extract just the hostname.
    const url = new URL(origin);
    const hostname = url.hostname; // This gives us 'demo.rfmsconnect.nl'

    // Query the settings table to find the customer associated with the domain
    const [settings] = await db.query(
      'SELECT customer_id FROM settings WHERE domain = ?', 
      [hostname]
    );
    
    if (settings && settings.length > 0) {
      req.tenantId = settings[0].customer_id;
    } else {
      req.tenantId = null;
    }
    
    next();
  } catch (error) {
    console.error('Error identifying tenant from origin:', error);
    res.status(500).send('Internal Server Error');
  }
};