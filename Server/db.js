import mariadb from 'mariadb';
import 'dotenv/config';

// Create a connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5, 
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  idleTimeout: 60000, // idle connections timeout after 60 seconds
  acquireTimeout: 30000, // timeout for acquiring a connection
  supportBigNumbers: true,
  bigNumberStrings: true,
});

console.log(' - Database connection pool created.');

// Export the pool so you can use it in other files
export default pool;