// api/auth/me.js
import { resolveUser } from '../_utils/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const me = await resolveUser(req);
    if (!me) return res.status(200).json({ loggedIn: false });
    return res.status(200).json({ loggedIn: true, user: me });
  }
  // Mantener soporte para DELETE si es necesario, aunque no usa clearSessionCookie
  if (req.method === 'DELETE') {
    return res.status(200).setHeader('Set-Cookie', 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT').json({ ok: true });
  }
  return res.status(405).end('Método no permitido');
}
