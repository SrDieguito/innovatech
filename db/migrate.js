import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

// Create a direct connection for migrations
const pool = mysql.createPool({
  host: 'switchback.proxy.rlwy.net',
  user: 'root',
  password: 'VPTjMcHjgqcmTVgYffQRpCIcUavFGRjB',
  database: 'railway',
  port: 42185,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const connection = await pool.getConnection();
  
  try {
    // Create migrations table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already run migrations
    const [rows] = await connection.query('SELECT name FROM migrations');
    const completedMigrations = new Set(rows.map(row => row.name));

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('Checking for new migrations...');
    let newMigrations = 0;

    // Run new migrations
    for (const file of migrationFiles) {
      if (!completedMigrations.has(file)) {
        console.log(`Running migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Run each statement separately
        const statements = sql.split(';').filter(statement => statement.trim() !== '');
        
        for (const statement of statements) {
          if (statement.trim() !== '') {
            await connection.query(statement);
          }
        }

        // Record migration
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        console.log(`✓ Applied migration: ${file}`);
        newMigrations++;
      }
    }

    if (newMigrations === 0) {
      console.log('No new migrations to run.');
    } else {
      console.log(`\nSuccessfully applied ${newMigrations} migration(s).`);
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigrations();
