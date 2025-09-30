// ============================================
// FILE: config/sessionConfig.js (NEW FILE)
// ============================================
import session from 'express-session';
import MySQLStore from 'express-mysql-session';

const MySQLStoreSession = MySQLStore(session);

// Create session store using your existing MariaDB configuration
const sessionStore = new MySQLStoreSession({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // Check every 15 minutes
  expiration: 86400000, // 24 hours
  createDatabaseTable: true, // Auto-creates 'sessions' table on first run
  connectionLimit: 1,
  endConnectionOnClose: true,
  charset: 'utf8mb4_bin',
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

// Session configuration
export const sessionConfig = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'change-this-secret-key-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
  name: 'rfms.sid', // Custom session cookie name
});

export default sessionConfig;