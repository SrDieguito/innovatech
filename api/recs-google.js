// /api/recs-google.js — Recomendaciones con Gemini + Crossref (CommonJS)
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CROSSREF_MAILTO = process.env.CROSSREF_MAILTO || 'devnull@example.com';
const { sanitizeQuery } = require('./_utils/wikimedia');

async function getTituloTarea(req, { tareaId, cursoId }) {
  try {
    const proto =
      req.headers['x-forwarded-proto'] ||
      (req.headers['referer'] && new URL(req.headers['referer']).protocol.replace(':', '')) ||
      'https';
    const host = req.headers['x-vercel-deployment-url'] || req.headers['host'];
    const base = `${proto}://${host}`;
    const u = new URL('/api/tareas', base);
    u.searchParams.set('action', 'detalle');
    u.searchParams.set('id', String(tareaId));
    if (cursoId) u.searchParams.set('cursoId', String(cursoId));
    const r = await fetch(u.toString());
    if (!r.ok) return null;
    const data = await r.json().catch(() => null);
    const tarea = data?.tarea || data;
    const titulo = tarea?.titulo || tarea?.nombre || '';
    return sanitizeQuery(titulo);
  } catch {
    return null;
  }
}

async function geminiKeywords({ q }) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const prompt = [
    'Devuélveme un JSON con dos campos: keywords (lista de 3-6 frases de búsqueda académica) y focus (string resumido del tema).',
    'No inventes referencias. SOLO genera palabras clave.',
    `Tema: ${q}`
  ].join('\n');
  
  const body = {
    generationConfig: { response_mime_type: 'application/json' },
    contents: [{ parts: [{ text: prompt }] }]
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'x-goog-api-key': GEMINI_KEY 
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    const err = new Error(`Gemini ${r.status} ${t.slice(0, 160)}`);
    err.status = r.status;
    throw err;
  }

  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { keywords: [q], focus: q };
  }
  
  const keywords = Array.isArray(parsed.keywords) && parsed.keywords.length 
    ? parsed.keywords 
    : [q];
    
  return { 
    keywords, 
    focus: String(parsed.focus || q) 
  };
}

async function crossrefSearch({ query, rows = 6, from = '2019-01-01' }) {
  const u = new URL('https://api.crossref.org/works');
  u.searchParams.set('query', query);
  u.searchParams.set('filter', `type:journal-article,from-pub-date:${from}`);
  u.searchParams.set('rows', String(rows));
  u.searchParams.set('mailto', CROSSREF_MAILTO);
  
  const r = await fetch(u.toString(), {
    headers: { 
      'User-Agent': `EducaTech/1.0 (${CROSSREF_MAILTO})`
    }
  });

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    const err = new Error(`Crossref ${r.status} ${t.slice(0, 160)}`);
    err.status = r.status;
    throw err;
  }

  const j = await r.json();
  const items = j?.message?.items || [];
  
  return items.map(w => {
    const title = (w.title && w.title[0]) || '';
    const year = w['published-print']?.['date-parts']?.[0]?.[0] || 
                w['published-online']?.['date-parts']?.[0]?.[0] || 
                w['issued']?.['date-parts']?.[0]?.[0] || 
                null;
    const doi = w.DOI || '';
    const doi_url = doi ? `https://doi.org/${doi}` : '';
    const pdf = (w.link || []).find(l => (l['content-type'] || '').includes('application/pdf')) || null;
    const pdf_url = pdf?.URL || null;
    const authors = (w.author || [])
      .map(a => [a.given, a.family].filter(Boolean).join(' '))
      .filter(Boolean);
      
    return { 
      title, 
      year, 
      doi, 
      doi_url, 
      pdf_url, 
      authors 
    };
  });
}

module.exports = async function handler(req, res) {
  try {
    if (!GEMINI_KEY) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY no está configurada' 
      });
    }

    const qp = req.query || {};
    const tareaId = qp.tareaId || qp.tarea_id || qp.id || null;
    const cursoId = qp.cursoId || qp.curso_id || qp.curso || null;
    
    let q = sanitizeQuery(qp.q || '');
    if (!q && tareaId) {
      q = (await getTituloTarea(req, { tareaId, cursoId })) || '';
    }
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Se requiere el parámetro q o tareaId para obtener el tema' 
      });
    }

    const { keywords, focus } = await geminiKeywords({ q });

    // Búsqueda en Crossref por cada palabra clave
    const seen = new Set();
    const out = [];
    
    for (const kw of keywords) {
      if (out.length >= 12) break;
      
      try {
        const works = await crossrefSearch({ 
          query: kw, 
          rows: 6 
        });
        
        for (const w of works) {
          if (!w.doi || seen.has(w.doi)) continue;
          
          seen.add(w.doi);
          out.push(w);
          
          if (out.length >= 12) break;
        }
      } catch (e) {
        console.error(`Error buscando "${kw}":`, e);
        // Continuar con la siguiente palabra clave
      }
    }

    return res.status(200).json({ 
      ok: true, 
      q, 
      focus, 
      items: out 
    });
    
  } catch (e) {
    console.error('Error en /api/recs-google:', e);
    const status = e?.status >= 400 && e?.status < 600 ? e.status : 502;
    return res.status(status).json({ 
      error: e.message || 'Error al generar recomendaciones',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};
