import { pool } from '../db.js';
import { topKeywords } from '../_utils/text.js';
import { khanSearchES } from '../_utils/khan.js';
import { getEstudianteId } from '../_utils/cookies.js';

async function getFallbackResources(tema) {
  const kaUrl = tema
    ? `https://es.khanacademy.org/search?referer=%2F&page_search_query=${encodeURIComponent(tema)}`
    : 'https://es.khanacademy.org/';
  return [
    { titulo: tema ? `Búsqueda: ${tema}` : 'Recursos educativos abiertos', url: kaUrl, snippet: `Buscar en Khan Academy`, source: 'Sistema', score: 100 },
  ];
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const tareaId = Number(req.query.tareaId || req.query.tarea_id);
    const cursoId = Number(req.query.cursoId || req.query.curso_id) || null;
    const estudianteId = getEstudianteId(req);

    if (!tareaId) {
      return res.status(200).json({ ok: true, meta: { tareaId, cursoId }, items: [] });
    }

    const [[tarea]] = await pool.query(
      `SELECT t.id, t.titulo, t.descripcion, t.tema_id, tm.nombre AS tema
       FROM tareas t LEFT JOIN temas tm ON tm.id = t.tema_id
       WHERE t.id = ? LIMIT 1`,
      [tareaId]
    );

    if (!tarea) {
      return res.status(200).json({ ok: true, meta: { tareaId, cursoId }, items: [] });
    }

    const baseText = `${tarea.tema || ''}. ${tarea.titulo || ''}. ${tarea.descripcion || ''}`.trim();
    const kws = topKeywords(baseText, 10);
    const query = (tarea.tema?.trim() ? tarea.tema : kws.slice(0, 6).join(' ')) || (tarea.titulo || '').slice(0, 120);

    let calificacion = null;
    if (estudianteId) {
      const [[ent]] = await pool.query(
        `SELECT calificacion FROM tareas_entregas
         WHERE tarea_id=? AND estudiante_id=? ORDER BY fecha_entrega DESC LIMIT 1`,
        [tareaId, estudianteId]
      );
      if (ent) calificacion = ent.calificacion;
    }

    let items = [];
    let khanError = null;
    try {
      items = await khanSearchES(query, kws);
      if (calificacion != null && items.length > 0) {
        const low = Number(calificacion) <= 70;
        items = items.map(it => {
          let bonus = 0;
          const t = `${it.titulo} ${it.snippet || ''}`.toLowerCase();
          if (low) {
            if (/introducci|basi|fundament|pr.ctica|ejercic/.test(t)) bonus += 2.5;
            if (/video/.test(t)) bonus += 0.5;
          } else {
            if (/avanzad|profund|teor|demostraci/.test(t)) bonus += 2.0;
          }
          return { ...it, score: (it.score || 0) + bonus };
        }).sort((a, b) => b.score - a.score);
      }
    } catch (err) {
      khanError = err.message;
    }

    if (items.length === 0 || khanError) {
      items = await getFallbackResources(tarea.tema || query);
    }

    return res.status(200).json({
      ok: true,
      meta: { tareaId, cursoId, query, keywords: kws, tema: tarea.tema || null, estudianteId, calificacion, khanError: khanError || undefined },
      items,
    });
  } catch (err) {
    console.error('Error in /api/recomendaciones:', err);
    return res.status(200).json({
      ok: true,
      meta: { error: 'Error al obtener recomendaciones' },
      items: await getFallbackResources(''),
    });
  }
}
