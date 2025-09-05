// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Import your routes
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import vehicleRoutes from './routes/vehicles.js';
import { isAuthenticated } from './middleware/isAuthenticated.js';

import logger from './utils/logger.js';

// It's a best practice to wrap your server start in an async function
async function startServer() {

  // --- CORS Configuration with Development Fix ---
  const corsOptions = {
    origin: async (origin, callback) => {
      // Allow requests with no origin (like Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // --- THIS IS THE FIX ---
      // If in development mode, explicitly allow the Vite server origin
      if (process.env.NODE_ENV === 'development' ) {
        return callback(null, true);
      }
      // --------------------

      // For all other requests, check the database
      let conn;
      try {
        const hostname = new URL(origin).hostname;
        conn = await db.getConnection();
        const [rows] = await conn.query('SELECT 1 FROM settings WHERE domain = ? LIMIT 1', [hostname]);
        
        if (rows.length > 0) {
          callback(null, true); // Domain is in the whitelist
        } else {
          callback(new Error('Not allowed by CORS')); // Domain is not in the whitelist
        }
      } catch (error) {
        callback(new Error('CORS check failed due to a server error'));
      } finally {
        if (conn) conn.release();
      }
    }
  };

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Apply Middleware
  app.use(cors(corsOptions));
  app.use(express.json());
  
  // Use morgan for HTTP request logging
  morgan.token('body', (req) => {
    return JSON.stringify(req.body);
  });
  morgan.token('user', (req) => {
  // Check if req.user exists (it's added by your authentication middleware)
  if (req.user) {
    // The payload you created in auth.js includes userId, customerId, and username
    return `userId:${req.user.id}, customerId:${req.user.customerId}`;
  }
  return 'Guest'; // Placeholder for unauthenticated requests
});
  // This format logs: IP, Method, URL, Status, and Body
  app.use(morgan(
    ':remote-addr - :user - :method :url :status - :response-time ms - Body: :body', 
    { stream: logger.stream }
  ));
  // Apply Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/settings', isAuthenticated, settingsRoutes);
  app.use('/api/dashboard', isAuthenticated, dashboardRoutes);
  app.use('/api/vehicles', isAuthenticated, vehicleRoutes); 
  
  // Start the Server
  app.listen(PORT, () => {
    console.log(` - Server is active on http://localhost:${PORT}`);
  });
}

startServer();