// api/_utils/cookies.js
export function getCookieMap(req) {
  const hdr = req.headers.cookie || '';
  const map = {};
  hdr.split(';').forEach(p => {
    const [k, ...v] = p.trim().split('=');
    if (!k) return;
    map[decodeURIComponent(k)] = decodeURIComponent((v || []).join('=') || '');
  });
  return map;
}

export function getEstudianteId(req) {
  const c = getCookieMap(req);
  const keys = ['estudiante_id', 'usuario_id', 'uid', 'user_id'];
  for (const k of keys) {
    const val = c[k];
    if (val && /^\d+$/.test(val)) return Number(val);
  }
  return null;
}
