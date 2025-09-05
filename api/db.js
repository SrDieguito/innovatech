import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'switchback.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'VPTjMcHjgqcmTVgYffQRpCIcUavFGRjB',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 42185,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  ssl: {
    // Required for Railway
    rejectUnauthorized: false
  }
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to the database');
    connection.release();
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
  }
}

// Test the connection when this module is loaded
testConnection();
