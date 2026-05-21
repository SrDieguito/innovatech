export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { fuente, titulo } = req.query;

  if (fuente === 'wikipedia' && titulo) {
    try {
      const params = new URLSearchParams({
        action: 'query',
        titles: String(titulo).slice(0, 200),
        prop: 'extracts',
        exsentences: '80',
        explaintext: '1',
        format: 'json',
        origin: '*',
      });
      const r = await fetch(`https://es.wikipedia.org/w/api.php?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) return res.status(502).json({ error: 'Wikipedia no disponible' });

      const data = await r.json();
      const page = Object.values(data.query?.pages || {})[0];
      if (!page || page.missing !== undefined) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
      }

      return res.json({
        titulo: page.title,
        contenido: (page.extract || '').trim(),
        url: `https://es.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        fuente: 'wikipedia',
      });
    } catch (err) {
      console.error('Error /api/articulo wikipedia:', err.message);
      return res.status(500).json({ error: 'Error al obtener artículo' });
    }
  }

  return res.status(400).json({ error: 'Parámetros inválidos. Use fuente=wikipedia&titulo=...' });
}
