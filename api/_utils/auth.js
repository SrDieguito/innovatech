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
    console.log('Buscando cookie de sesión...');
    const token = cookies[cookieName];
    console.log('Token JWT encontrado:', token ? 'Sí' : 'No');
    
    if (!token) {
      console.log('No se encontró token JWT en las cookies');
      return null;
    }
    
    console.log('Verificando token JWT...');
    const { payload } = await jwtVerify(token, secret);
    console.log('Payload JWT:', payload);
    
    if (!payload?.id) {
      console.log('El payload JWT no contiene ID de usuario');
      return null;
    }
    
    const userData = { 
      id: Number(payload.id), 
      rol: payload.rol, 
      nombre: payload.nombre,  
      email: payload.email 
    };
    
    console.log('Usuario autenticado vía JWT:', userData);
    return userData;
    
  } catch (error) {
    console.error('Error en verificación JWT:', error.message);
    if (error.code) console.error('Código de error:', error.code);
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
  console.log('Iniciando verificación de sesión...');
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const base = `${proto}://${host}`;
    const url = `${base}/api/verificarsesion`;
    
    console.log('Solicitando verificación a:', url);
    console.log('Cookies enviadas:', req.headers.cookie);
    
    const r = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      },
      credentials: 'include',
      method: 'GET'
    });
    
    console.log('Respuesta de verificación de sesión:', r.status, r.statusText);
    
    if (!r.ok) {
      console.error('Error en la respuesta:', await r.text().catch(() => 'No se pudo leer el cuerpo de la respuesta'));
      return null;
    }
    
    const data = await r.json().catch(err => {
      console.error('Error al parsear JSON de respuesta:', err);
      return null;
    });
    
    console.log('Datos de verificación:', data);
    
    if (data?.autenticado && data.usuario) {
      const userData = {
        id: Number(data.usuario.id),
        rol: data.usuario.rol,
        nombre: data.usuario.nombre,
        email: data.usuario.email
      };
      console.log('Usuario autenticado vía verificación de sesión:', userData);
      return userData;
    }
    
    console.log('La verificación de sesión no devolvió un usuario autenticado');
    return null;
    
  } catch (error) {
    console.error('Error en verificación de sesión:', error.message);
    if (error.code) console.error('Código de error:', error.code);
    return null;
  }
}

export async function resolveUser(req) {
  console.log('=== Iniciando resolveUser ===');
  try {
    // 1) Check for testing override
    const qId = Number((req.query?.estudiante_id) || (req.body?.estudiante_id));
    if (Number.isInteger(qId) && qId > 0) {
      console.log('Usando estudiante_id de query/body:', qId);
      return { id: qId };
    }

    console.log('Parseando cookies...');
    const cookies = await parseCookies(req);
    console.log('Cookies parseadas:', cookies);

    // 2) Try JWT session first (main auth method)
    console.log('Intentando autenticación JWT...');
    const fromJose = await tryJoseJWT(cookies);
    console.log('Resultado JWT:', fromJose);
    if (fromJose?.id) {
      console.log('Autenticado por JWT');
      return fromJose;
    }

    // 3) Fallback to legacy user_id cookie
    console.log('Intentando autenticación por cookie legacy...');
    const fromLegacy = tryLegacyId(cookies);
    console.log('Resultado cookie legacy:', fromLegacy);
    if (fromLegacy?.id) {
      console.log('Autenticado por cookie legacy');
      return fromLegacy;
    }

    // 4) Last resort: try session verification endpoint
    console.log('Intentando verificación de sesión...');
    const fromVerifier = await tryVerificarSesion(req);
    console.log('Resultado verificación de sesión:', fromVerifier);
    if (fromVerifier?.id) {
      console.log('Autenticado por verificación de sesión');
      return fromVerifier;
    }

    console.log('Ningún método de autenticación funcionó');
    return null;
  } catch (error) {
    console.error('Error en resolveUser:', error);
    return null;
  } finally {
    console.log('=== Finalizando resolveUser ===');
  }
}