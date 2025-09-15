// api/auth/me.js
import { readSession, clearSessionCookie } from '../_utils/session.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const me = await readSession(req);
    if (!me) return res.status(200).json({ loggedIn: false });
    
    // Solo devolver datos seguros del usuario
    const { id, nombre, email, rol } = me;
    return res.status(200).json({ 
      loggedIn: true, 
      user: { id, nombre, email, rol }
    });
  }
  
  if (req.method === 'DELETE') {
    // Cerrar sesión
    return res.status(200)
      .setHeader('Set-Cookie', clearSessionCookie())
      .json({ ok: true });
  }
  
  return res.status(405).end('Método no permitido');
}
