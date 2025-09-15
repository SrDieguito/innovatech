// api/recomendaciones.js
import mysql from 'mysql2/promise';
import { tareaToTema, slugify } from './_utils/text.js';
import { readSession } from './_utils/session.js';

const pool = mysql.createPool({
  uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 5,
});

async function getTarea(conn, tarea_id) {
  const [rows] = await conn.execute(
    `SELECT t.id, t.curso_id, t.titulo, t.descripcion, t.tema_id
     FROM tareas t WHERE t.id = ? LIMIT 1`, [tarea_id]
  );
  return rows[0] || null;
}

async function ensureTemaFromTarea(conn, tarea) {
  // Si ya tiene tema_id, devuélvelo
  if (tarea.tema_id) return tarea.tema_id;

  // Inferir del título/descr. y crear/obtener en 'temas'
  const { slug, nombre } = tareaToTema({ titulo: tarea.titulo, descripcion: tarea.descripcion });
  if (!slug) return null;

  // Buscar si existe
  const [existe] = await conn.execute(
    `SELECT id FROM temas WHERE slug = ? LIMIT 1`, [slug]
  );
  if (existe[0]) return existe[0].id;

  // Crear
  const [ins] = await conn.execute(
    `INSERT INTO temas (slug, nombre) VALUES (?, ?)`, [slug, nombre]
  );
  const temaId = ins.insertId;

  // Guardar en tarea (opcional, pero útil)
  await conn.execute(`UPDATE tareas SET tema_id = ? WHERE id = ?`, [temaId, tarea.id]);
  return temaId;
}

async function getCalificacion(conn, tarea_id, estudiante_id) {
  const [rows] = await conn.execute(
    `SELECT calificacion
       FROM tareas_entregas
      WHERE tarea_id = ? AND estudiante_id = ?
      LIMIT 1`,
    [tarea_id, estudiante_id]
  );
  return rows[0]?.calificacion ?? null;
}

async function getRecursosInternosPorTema(conn, tema_id, limit=5) {
  const [rows] = await conn.execute(
    `SELECT r.id, r.fuente, r.url, r.titulo, r.descripcion, r.licencia, r.dificultad
       FROM recursos r
       JOIN recurso_tema rt ON rt.recurso_id = r.id
      WHERE rt.tema_id = ?
      ORDER BY r.id DESC
      LIMIT ?`,
    [tema_id, limit]
  );
  return rows;
}

// Fallback web → Khan Academy (heurístico y robusto):
async function fetchKhan(query, limit=5) {
  const results = [];

  // 1) Endpoint HTML de búsqueda (simple y estable): /search?page_search_query=...
  // Nota: evitamos parseo complejo; devolvemos enlaces principales conocidos.
  const url = `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const html = await res.text();

    // Extrae algunos enlaces Khan (ej: /math/... o /science/...)
    const re = /href="(\/[a-z0-9\-\/]+)"/gi;
    const seen = new Set();
    let m;
    while ((m = re.exec(html)) && results.length < limit) {
      const path = m[1];
      // Filtra solo contenido curricular típico
      if (/^\/(math|science|computing|economics|humanities|test-prep)\//.test(path)) {
        if (!seen.has(path)) {
          seen.add(path);
          results.push({
            fuente: 'web',
            url: `https://www.khanacademy.org${path}`,
            titulo: path.split('/').slice(-1)[0].replace(/-/g,' ').slice(0, 100),
            descripcion: `Recurso de Khan Academy relacionado con "${query}".`,
            licencia: 'KhanAcademy',
            dificultad: null
          });
        }
      }
    }
  } catch(e) {
    // Silencioso; si falla, devolvemos vacío
  }

  return results;
}

function okJson(res, data, status=200) {
  res.statusCode = status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return okJson(res, { error: 'Método no permitido' }, 405);
    
    const { action } = req.query;
    if (action !== 'por-tarea') return okJson(res, { error: 'Acción no soportada' }, 400);

    const tarea_id = Number(req.query.tarea_id);
    if (!Number.isInteger(tarea_id) || tarea_id <= 0) {
      return okJson(res, { error: 'tarea_id inválido' }, 400);
    }

    // Verificar sesión y obtener usuario actual
    const session = await readSession(req);
    if (!session) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener ID de estudiante (por defecto el usuario actual, a menos que sea profesor)
    const estudianteId = parseInt(req.query.estudiante_id) || session.id;
  
    // Control de acceso: solo el propio estudiante o un profesor pueden ver las recomendaciones
    if (session.rol !== 'profesor' && estudianteId !== session.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const conn = await pool.getConnection();
    try {
      const tarea = await getTarea(conn, tarea_id);
      if (!tarea) return okJson(res, { error: 'Tarea no existe' }, 404);

      const calificacion = await getCalificacion(conn, tarea_id, estudianteId);

      // Política: recomendar sólo si calificación ≤ 7 (si es null, no recomendar)
      if (calificacion == null || calificacion > 7) {
        return okJson(res, {
          mostrar: false,
          motivo: 'Sin recomendaciones (no cumple condición ≤ 7 o no hay calificación).',
          calificacion
        });
      }

      // Asegurar tema
      const temaId = await ensureTemaFromTarea(conn, tarea);
      let recursos = [];
      if (temaId) {
        recursos = await getRecursosInternosPorTema(conn, temaId, 5);
      }

      // Si hay menos de 3 internos, completar con Khan Academy
      if (recursos.length < 3) {
        const q = `${tarea.titulo} ${tarea.descripcion}`.trim() || 'aprendizaje';
        const web = await fetchKhan(q, 5 - recursos.length);
        recursos = recursos.concat(web);
      }

      // (Opcional) actualizar tabla estudiante_tema
      // Nota: no obligatorio para mostrar recomendaciones.
      // try {
      //   await conn.execute(
      //     `INSERT INTO estudiante_tema (estudiante_id, tema_id, aciertos, fallos, nota_media, mastery_prob)
      //      VALUES (?, ?, 0, 1, ?, NULL)
      //      ON DUPLICATE KEY UPDATE fallos = fallos + 1, nota_media = IFNULL( (IFNULL(nota_media, ?)+?)/2, ?)`,
      //     [estudiante_id, temaId, calificacion, calificacion, calificacion, calificacion]
      //   );
      // } catch {}

      return okJson(res, {
        mostrar: true,
        calificacion,
        tema_id: temaId,
        recursos
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return okJson(res, { error: 'Error interno' }, 500);
  }
}
