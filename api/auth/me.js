// api/auth/me.js
import { getUserFromRequest, clearSessionCookie } from '../_utils/session.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const me = await getUserFromRequest(req);
    if (!me) return res.status(200).json({ loggedIn: false });
    return res.status(200).json({ loggedIn: true, user: me });
  }
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end('Método no permitido');
}
