import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

// WebSocket constructor needed for the Pool (transactions only)
neonConfig.webSocketConstructor = ws;

const isVercel = !!process.env.VERCEL;
const connectionString = process.env.DATABASE_URL;

// HTTP driver — pure HTTPS, zero TLS socket issues on Vercel serverless
const _http = neon(connectionString, { fullResults: true });

// WebSocket Pool used ONLY for getConnection() / transactions
let _pool = null;
function txPool() {
  if (!_pool) _pool = new Pool({ connectionString, max: 1 });
  return _pool;
}

function toPgSQL(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function execHTTP(sql, params = []) {
  const result = await _http.query(toPgSQL(sql), params || []);
  const rows = result.rows;
  rows.affectedRows = result.rowCount ?? rows.length;
  return [rows];
}

async function execWS(client, sql, params = []) {
  const result = await client.query(toPgSQL(sql), params);
  const rows = result.rows;
  rows.affectedRows = result.rowCount;
  return [rows];
}

export const pool = {
  query:   (sql, params) => execHTTP(sql, params),
  execute: (sql, params) => execHTTP(sql, params),

  async getConnection() {
    const client = await txPool().connect();
    return {
      query:   (sql, params) => execWS(client, sql, params),
      execute: (sql, params) => execWS(client, sql, params),
      async beginTransaction() { await client.query('BEGIN'); },
      async commit()           { await client.query('COMMIT'); },
      async rollback()         { await client.query('ROLLBACK'); },
      release()                { client.release(); },
      async end()              { client.release(); },
    };
  },
};

if (!isVercel) {
  _http.query('SELECT 1', []).then(() => {
    console.log('✅ Conectado a PostgreSQL (Neon HTTP)');
  }).catch(err => {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  });
}
