import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const _pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Converts MySQL ? placeholders to PostgreSQL $1, $2, ...
function toPgSQL(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Runs a query and returns [rows] with rows.affectedRows (compat with mysql2 pattern)
async function execQuery(client, sql, params = []) {
  const result = await client.query(toPgSQL(sql), params);
  const rows = result.rows;
  rows.affectedRows = result.rowCount;
  return [rows];
}

export const pool = {
  query:   (sql, params) => execQuery(_pool, sql, params),
  execute: (sql, params) => execQuery(_pool, sql, params),

  async getConnection() {
    const client = await _pool.connect();
    return {
      query:   (sql, params) => execQuery(client, sql, params),
      execute: (sql, params) => execQuery(client, sql, params),
      async beginTransaction() { await client.query('BEGIN'); },
      async commit()           { await client.query('COMMIT'); },
      async rollback()         { await client.query('ROLLBACK'); },
      release()                { client.release(); },
      async end()              { client.release(); },
    };
  },
};

_pool.query('SELECT 1').then(() => {
  console.log('✅ Conectado a PostgreSQL (Neon)');
}).catch(err => {
  console.error('❌ Error conectando a PostgreSQL:', err.message);
});
