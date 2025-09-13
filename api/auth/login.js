// api/auth/login.js
import mysql from 'mysql2/promise';
import { createSessionCookie } from '../_utils/session.js';
import crypto from 'crypto';

const pool = mysql.createPool({
  uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
  waitForConnections: true, connectionLimit: 5,
});

// Utiliza el hash que ya manejes. Ejemplo: sha256 plano (cámbialo si usas otro).
function hash(pwd='') { return crypto.createHash('sha256').update(pwd).digest('hex'); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Método no permitido');

  try {
    const { email='', password='' } = JSON.parse(req.body || '{}');
    if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales' });

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, nombre, email, rol, password
           FROM usuarios
          WHERE email = ? LIMIT 1`, [email]
      );
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

      // compara hash
      if (user.password && user.password !== hash(password)) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const cookie = await createSessionCookie({
        id: user.id, rol: user.rol, nombre: user.nombre, email: user.email
      });

      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({ ok: true, id: user.id, rol: user.rol, nombre: user.nombre });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error interno' });
  }
}
