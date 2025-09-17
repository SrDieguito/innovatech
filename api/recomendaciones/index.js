// api/recomendaciones/index.js
import mysql from 'mysql2/promise';
import { topKeywords } from '../_utils/text.js';
import { khanSearchES } from '../_utils/khan.js';
import { getEstudianteId } from '../_utils/cookies.js';

const cfg = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || process.env.DB_DATABASE
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ ok:false, error:'Method not allowed' });

    const tareaId = Number(req.query.tareaId || req.query.tarea_id);
    const cursoId = Number(req.query.cursoId || req.query.curso_id) || null;
    const estudianteId = getEstudianteId(req); // opcional

    if (!tareaId) {
      return res.status(200).json({ ok:true, meta:{tareaId,cursoId}, items:[] });
    }

    const cn = await mysql.createConnection(cfg);

    // --- tarea + tema ---
    const [rows] = await cn.execute(`
      SELECT t.id, t.titulo, t.descripcion, t.tema_id, tm.nombre AS tema
      FROM tareas t
      LEFT JOIN temas tm ON tm.id = t.tema_id
      WHERE t.id = ? LIMIT 1
    `, [tareaId]);

    if (!rows?.length) {
      await cn.end();
      return res.status(200).json({ ok:true, meta:{tareaId,cursoId}, items:[] });
    }

    const tarea = rows[0];
    const baseText = `${tarea.tema || ''}. ${tarea.titulo || ''}. ${tarea.descripcion || ''}`.trim();
    const kws = topKeywords(baseText, 10);
    const query = (tarea.tema?.trim() ? tarea.tema : kws.slice(0,6).join(' ')) || (tarea.titulo||'').slice(0,120);

    // --- calificación del alumno (opcional) ---
    let calificacion = null;
    if (estudianteId) {
      const [ent] = await cn.execute(`
        SELECT calificacion
        FROM tareas_entregas
        WHERE tarea_id=? AND estudiante_id=?
        ORDER BY fecha_entrega DESC
        LIMIT 1
      `, [tareaId, estudianteId]);
      if (ent?.length) calificacion = ent[0].calificacion;
    }
    await cn.end();

    // --- búsqueda en Khan ES ---
    let items = await khanSearchES(query, kws);

    // --- personalización simple por nota ---
    if (calificacion != null) {
      const low = Number(calificacion) <= 70;
      items = items.map(it => {
        let bonus = 0;
        const t = `${it.titulo} ${it.snippet||''}`.toLowerCase();

        // si le fue bajo: premia intro/práctica; si alto: premia avanzado
        if (low) {
          if (/introducci|basi|fundament|práctica|practica|ejercic/.test(t)) bonus += 2.5;
          if (/video/.test(t)) bonus += 0.5;
        } else {
          if (/avanzad|profund|teor|demostraci/.test(t)) bonus += 2.0;
        }
        return { ...it, score: (it.score||0) + bonus };
      }).sort((a,b)=>b.score-a.score);
    }

    return res.status(200).json({
      ok:true,
      meta:{ tareaId, cursoId, query, keywords:kws, tema:tarea.tema||null, estudianteId, calificacion },
      items
    });
  } catch (err) {
    return res.status(200).json({ ok:true, meta:{ error:String(err?.message||err) }, items:[] });
  }
}
