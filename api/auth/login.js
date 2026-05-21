import { pool } from '../db.js';
import { createSessionCookie } from '../_utils/session.js';
import crypto from 'crypto';

function hash(pwd = '') { return crypto.createHash('sha256').update(pwd).digest('hex'); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Método no permitido');

  try {
    const { email = '', password = '' } = JSON.parse(req.body || '{}');
    if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales' });

    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, password FROM usuarios WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (user.password && user.password !== hash(password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const cookie = await createSessionCookie({
      id: user.id, rol: user.rol, nombre: user.nombre, email: user.email,
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true, id: user.id, rol: user.rol, nombre: user.nombre });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error interno' });
  }
}
