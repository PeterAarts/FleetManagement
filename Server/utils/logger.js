import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Define the directory where logs will be stored
const logDirectory = path.join(process.cwd(), 'logs');

// Create a new daily rotating file transport
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  level: 'info', // Log 'info' level messages and higher (info, warn, error)
  dirname: logDirectory,
  filename: '%DATE%.log', // File name pattern
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, // Compress old log files
  maxSize: '20m', // Rotate log file when it exceeds 20MB
  maxFiles: '14d' // Keep logs for 14 days
});



// Create the Winston logger instance
const logger = winston.createLogger({
  level: 'info',
  // Log in a structured JSON format
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    // In development, also log to the console for easy debugging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    dailyRotateFileTransport
  ],
  exitOnError: false
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;