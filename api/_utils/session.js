// api/_utils/session.js
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret');
const cookieName = 'session';

export async function createSessionCookie(payload, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secret);

  const cookie = [
    `${cookieName}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    // En prod, si usas HTTPS:
    // `Secure`,
    `Max-Age=${maxAgeSeconds}`
  ].join('; ');
  return cookie;
}

export async function getUserFromRequest(req) {
  try {
    const cookies = req.headers.cookie || '';
    const match = cookies.split('; ').find(c => c.startsWith(`${cookieName}=`));
    if (!match) return null;
    const token = match.split('=')[1];
    const { payload } = await jwtVerify(token, secret);
    return payload; // { id, rol, nombre, email, ... }
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  return [`${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`].join('; ');
}
