// server.js - Production-ready version with security hardening
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import sessionConfig from './config/sessionConfig.js';

// Import your routes
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/driver.js';
import trailerRoutes from './routes/trailers.js';
import sessionRoutes from './routes/session.js';
import debugRoutes from './routes/debug.js';
import geofenceRoutes from './routes/geofences.js';
import formbuilderRoutes from './routes/formbuilder.js';

import { sessionAuth } from './middleware/sessionAuth.js';
import { trackActivity, checkInactivity, getActivityStatus } from './middleware/activityTracker.js';

import logger from './utils/logger.js';

// Import your database connection (assuming you have a db.js file)
// You'll need to create this file for MariaDB connection
// import db from './config/db.js';

// It's a best practice to wrap your server start in an async function
async function startServer() {

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Security: Hide Express signature
  app.disable('x-powered-by');

  // Security headers using Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Rate limiting - protect against DDoS and brute force
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More restrictive in production
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for successful auth requests to avoid lockouts
    skip: (req, res) => {
      return req.path === '/api/auth/login' && res.statusCode < 400;
    }
  });

  // Apply rate limiting to all API routes
  app.use('/api/', limiter);

  // Input sanitization - prevents NoSQL injection attacks
  app.use(ExpressMongoSanitize({
    replaceWith: '_'
  }));
  
  // Parameter pollution protection
  app.use(hpp({
    whitelist: ['sort', 'filter'] // Allow these parameters to appear multiple times
  }));
  
  // Body parsing with security limits
  app.use(express.json({ 
    limit: '10kb',
    strict: true,
    type: ['application/json', 'application/*+json']
  }));

  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10kb',
    parameterLimit: 20
  }));

  // Session management
  app.use(sessionConfig);

  // --- CORS Configuration with Development Fix ---
  const corsOptions = {
    origin: async (origin, callback) => {
      // Allow requests with no origin (like Postman, mobile apps)
      if (!origin) {
        return callback(null, true);
      }
      
      // In development mode, allow all origins for easier testing
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Production CORS: Check against environment variable or database
      try {
        const hostname = new URL(origin).hostname;
        
        // First check environment variable for allowed origins
        const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
        if (allowedOrigins.includes(origin) || allowedOrigins.includes(hostname)) {
          return callback(null, true);
        }

        // Fallback: Check database for dynamic domain whitelist
        // Uncomment and adjust this section when you have db connection ready
        /*
        const conn = await db.getConnection();
        const [rows] = await conn.query('SELECT 1 FROM settings WHERE domain = ? LIMIT 1', [hostname]);
        
        if (rows.length > 0) {
          callback(null, true); // Domain is in the whitelist
        } else {
          logger.warn(`CORS blocked request from: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
        conn.release();
        */
        
        // For now, reject unknown origins in production
        logger.warn(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
        
      } catch (error) {
        logger.error('CORS check failed:', error);
        callback(new Error('CORS check failed due to a server error'));
      }
    },
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Background-Refresh'],
    maxAge: 86400 // Cache preflight response for 24 hours
  };

  app.use(cors(corsOptions));

  // Enhanced Morgan logging with security information
  morgan.token('body', (req) => {
    // Don't log sensitive data
    if (req.body && req.body.password) {
      const sanitizedBody = { ...req.body };
      sanitizedBody.password = '[REDACTED]';
      return JSON.stringify(sanitizedBody);
    }
    return req.body ? JSON.stringify(req.body) : '';
  });

  morgan.token('user', (req) => {
    // Check if req.user exists (added by authentication middleware)
    if (req.user) {
      return `userId:${req.user.id}, customerId:${req.user.customerId}`;
    }
    return 'Guest';
  });

  morgan.token('user-agent', (req) => {
    return req.get('User-Agent') || '';
  });

  // Comprehensive logging format
  const logFormat = process.env.NODE_ENV === 'production' 
    ? ':remote-addr - :user - :method :url :status - :response-time ms - ":user-agent"'
    : ':remote-addr - :user - :method :url :status - :response-time ms - Body: :body';

  app.use(morgan(logFormat, { 
    stream: logger.stream,
    skip: (req, res) => {
      // Skip logging for health checks in production
      return process.env.NODE_ENV === 'production' && req.url === '/health';
    }
  }));

  // Health check endpoint (before authentication)
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  });

  // Define public routes first with NO auth middleware
  app.use('/api/auth', authRoutes);
  const protectedMiddleware = [sessionAuth, trackActivity, checkInactivity];
  // Apply Routes with proper error handling

  app.use('/api/session', sessionRoutes); // >>> ADD THIS LINE <<<
  app.use('/api/settings', protectedMiddleware, settingsRoutes); // >>> CHANGE to sessionAuth
  app.use('/api/dashboard', protectedMiddleware, dashboardRoutes);
  app.use('/api/vehicles', protectedMiddleware, vehicleRoutes); 
  app.use('/api/driver', protectedMiddleware,driverRoutes);
  app.use('/api/trailers', protectedMiddleware, trailerRoutes);
  app.use('/api/geofences', geofenceRoutes);
  app.use('/api/formbuilder', protectedMiddleware, formbuilderRoutes);

  if (process.env.NODE_ENV === 'development') {
    app.use('/api/debug', debugRoutes);
  }
  // Global error handler
  app.use((err, req, res, next) => {
    // Log the error
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 404 handler for unmatched routes
  app.use('*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: 'Route not found',
      timestamp: new Date().toISOString()
    });
  });

  // Graceful shutdown handling
  const server = app.listen(PORT, () => {
    console.log(` - Server is active on http://localhost:${PORT}`);
    console.log(` - Environment: ${process.env.NODE_ENV}`);
    console.log(` - Security: Enhanced middleware active`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});