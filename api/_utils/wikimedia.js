// api/_utils/wikimedia.js
const BASE = 'https://api.wikimedia.org';
const APP_UA = process.env.WM_APP_UA || 'EducaTech/1.0 (contacto@example.com)';
const TOKEN = process.env.WIKIMEDIA_TOKEN || null;

export async function wmFetch(path, params = {}) {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const headers = { 'Api-User-Agent': APP_UA };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`Wikimedia ${r.status}`);
  return r.json();
}

export async function buscarPaginas({ q, lang = 'es', limite = 8 }) {
  return wmFetch(`/core/v1/wikipedia/${lang}/search/page`, { q, limit: String(limite) });
}
