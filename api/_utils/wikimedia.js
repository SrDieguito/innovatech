// CommonJS para Vercel/Node (evita 500 por ESM)
const BASE = 'https://api.wikimedia.org';
const APP_UA = process.env.WM_APP_UA || 'EducaTech/1.0 (contacto@example.com)';
const TOKEN = process.env.WIKIMEDIA_TOKEN || null;
const TIMEOUT_MS = 9000;

function sanitizeQuery(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

async function wmFetch(path, params = {}) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') url.searchParams.set(k, v);
  const headers = {
    'User-Agent': APP_UA,
    'Api-User-Agent': APP_UA
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers, signal: ctrl.signal });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      const msg = `Wikimedia ${r.status}${txt ? ` : ${txt.slice(0,180)}` : ''}`;
      const err = new Error(msg);
      err.status = r.status;
      throw err;
    }
    return r.json();
  } finally {
    clearTimeout(t);
  }
}

async function buscarPaginas({ q, lang = 'es', limite = 8 }) {
  const query = sanitizeQuery(q);
  if (!query) return { pages: [] };
  // Core REST Search (page) — devuelve pages[].title/description/thumbnail/key
  // https://api.wikimedia.org/core/v1/wikipedia/{lang}/search/page?q=...
  return wmFetch(`/core/v1/wikipedia/${lang}/search/page`, { q: query, limit: String(limite) });
}

module.exports = { wmFetch, buscarPaginas, sanitizeQuery };
