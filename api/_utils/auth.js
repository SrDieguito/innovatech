// api/_utils/auth.js
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret');
const cookieName = 'session';

export async function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const jar = {};
  raw.split(/; */).forEach(pair => {
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const k = decodeURIComponent(pair.slice(0, idx).trim());
    const v = decodeURIComponent(pair.slice(idx + 1).trim());
    jar[k] = v;
  });
  return jar;
}

async function tryJoseJWT(cookies) {
  try {
    const token = cookies[cookieName];
    if (!token) return null;
    
    const { payload } = await jwtVerify(token, secret);
    if (!payload?.id) return null;
    
    return { 
      id: Number(payload.id), 
      rol: payload.rol, 
      nombre: payload.nombre,  
      email: payload.email 
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

function tryLegacyId(cookies) {
  // Check for user_id cookie as fallback
  const raw = cookies.user_id || null;
  const id = Number(raw);
  if (Number.isInteger(id) && id > 0) return { id };
  return null;
}

async function tryVerificarSesion(req) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const base = `${proto}://${host}`;
    
    const r = await fetch(`${base}/api/verificarsesion`, {
      headers: {
        cookie: req.headers.cookie || ''
      },
      credentials: 'include',
      method: 'GET'
    });
    
    if (!r.ok) return null;
    const data = await r.json();
    
    if (data?.autenticado && data.usuario) {
      return {
        id: Number(data.usuario.id),
        rol: data.usuario.rol,
        nombre: data.usuario.nombre,
        email: data.usuario.email
      };
    }
    return null;
  } catch (error) {
    console.error('Error en verificación de sesión:', error);
    return null;
  }
}

export async function resolveUser(req) {
  try {
    // 1) Check for testing override
    const qId = Number((req.query?.estudiante_id) || (req.body?.estudiante_id));
    if (Number.isInteger(qId) && qId > 0) return { id: qId };

    const cookies = await parseCookies(req);

    // 2) Try JWT session first (main auth method)
    const fromJose = await tryJoseJWT(cookies);
    if (fromJose?.id) return fromJose;

    // 3) Fallback to legacy user_id cookie
    const fromLegacy = tryLegacyId(cookies);
    if (fromLegacy?.id) return fromLegacy;

    // 4) Last resort: try session verification endpoint
    const fromVerifier = await tryVerificarSesion(req);
    if (fromVerifier?.id) return fromVerifier;

    return null;
  } catch (error) {
    console.error('Error in resolveUser:', error);
    return null;
  }
}