// api/recomendaciones/index.js
import mysql from 'mysql2/promise';
import { topKeywords } from '../_utils/text.js';
import { khanSearchES } from '../_utils/khan.js';

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
    const cursoId = Number(req.query.cursoId || req.query.curso_id); // opcional, solo para trazas

    if (!tareaId) {
      // nunca 500 por validación
      return res.status(200).json({ ok:true, meta:{tareaId,cursoId}, items:[] });
    }

    // 1) obtener título/descripcion de la tarea
    const cn = await mysql.createConnection(cfg);
    const [rows] = await cn.execute(
      'SELECT id, titulo, descripcion FROM tareas WHERE id=? LIMIT 1', [tareaId]
    );
    await cn.end();

    if (!rows?.length) {
      return res.status(200).json({ ok:true, meta:{tareaId,cursoId}, items:[] });
    }

    const tarea = rows[0];
    const baseText = `${tarea.titulo || ''}. ${tarea.descripcion || ''}`;

    // 2) keywords/tema
    const kws = topKeywords(baseText, 8);
    const query = kws.join(' ');

    // 3) buscar en Khan ES y puntuar
    const items = query ? await khanSearchES(query, kws) : [];

    return res.status(200).json({
      ok:true,
      meta:{ tareaId, cursoId, query, keywords:kws, fuente:'khan_es' },
      items
    });
  } catch (err) {
    // Nunca romper UI: responder 200 con items vacíos y error en meta
    return res.status(200).json({ ok:true, meta:{ error:String(err?.message||err) }, items:[] });
  }
}
