// api/_utils/auth.js
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
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret');
    const token = cookies.session;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (!payload?.id) return null;
    return { 
      id: Number(payload.id), 
      rol: payload.rol, 
      nombre: payload.nombre,  
      email: payload.email 
    };
  } catch {
    return null;
  }
}

function tryLegacyId(cookies) {
  // Prioritize user_id cookie as per requirements
  const raw = 
    cookies.user_id || // Primary cookie
    cookies.usuario_id ||
    cookies.userId ||
    cookies.uid ||
    cookies.id ||
    null;
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
        // Reenviar cookies de la petición del cliente
        cookie: req.headers.cookie || ''
      },
      method: 'GET'
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => ({}));
    // Adapta a la salida real de tu verificarsesion
    const id = Number(data?.usuario?.id || data?.id || data?.data?.usuarioId);
    if (Number.isInteger(id) && id > 0) {
      return {
        id,
        rol: data?.usuario?.rol || data?.rol,
        nombre: data?.usuario?.nombre || data?.nombre,
        email: data?.usuario?.email || data?.email
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function resolveUser(req) {
  // 0) override de testing
  const qId = Number((req.query && req.query.estudiante_id) || (req.body && req.body.estudiante_id));
  if (Number.isInteger(qId) && qId > 0) return { id: qId };

  const cookies = await parseCookies(req);

  // 1) JWT con jose (si está)
  const fromJose = await tryJoseJWT(cookies);
  if (fromJose?.id) return fromJose;

  // 2) cookie legacy con id plano
  const fromLegacy = tryLegacyId(cookies);
  if (fromLegacy?.id) return fromLegacy;

  // 3) tu endpoint de verificación de sesión
  const fromVerifier = await tryVerificarSesion(req);
  if (fromVerifier?.id) return fromVerifier;

  // 4) nada
  return null;
}