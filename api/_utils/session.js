// api/_utils/session.js
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change');
const COOKIE_NAME = 'edutech_session';

export async function createSessionCookie(payload, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(JWT_SECRET);

  const cookie = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    `Max-Age=${maxAgeSeconds}`
  ].join('; ');
  return cookie;
}

export async function readSession(req) {
  try {
    const raw = req.headers.cookie || '';
    const kv = raw.split(';').map(s => s.trim());
    const pair = kv.find(s => s.startsWith(COOKIE_NAME + '='));
    if (!pair) return null;
    const token = pair.split('=')[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload; // { id, nombre, rol, email, ... }
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
