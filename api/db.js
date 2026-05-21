import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
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
