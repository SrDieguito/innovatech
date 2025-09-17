// api/recomendaciones.js
import mysql from 'mysql2/promise';
import { slugify } from './_utils/text.js';

// Función para obtener la conexión a la base de datos
async function getPool() {
  return mysql.createPool({
    uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 5,
  });
}

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

import { parse } from 'cookie';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret');
const cookieName = 'session';

async function verifySession(req) {
  try {
    if (!req.headers.cookie) {
      return { autenticado: false, mensaje: 'No hay sesión activa' };
    }

    const cookies = parse(req.headers.cookie);
    const token = cookies[cookieName];

    if (!token) {
      return { autenticado: false, mensaje: 'No hay token de sesión' };
    }

    const { payload } = await jwtVerify(token, secret);
    
    if (!payload?.id) {
      return { autenticado: false, mensaje: 'Token inválido' };
    }

    return {
      autenticado: true,
      usuario: {
        id: payload.id,
        rol: payload.rol,
        nombre: payload.nombre,
        email: payload.email
      }
    };
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    return { autenticado: false, mensaje: 'Sesión expirada o inválida' };
  }
}

// Función para obtener el usuario desde la sesión (si existe)
async function getUsuarioFromRequest(req) {
  try {
    const session = await verifySession(req);
    return session.autenticado ? session.usuario : null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const t0 = Date.now();
  try {
    const { method, query } = req;
    if (method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const tareaId = Number(query.tarea_id || query.tareaId);
    const cursoId = Number(query.curso_id || query.cursoId);
    
    if (!tareaId || !cursoId) {
      return res.status(400).json({ error: 'tarea_id y curso_id requeridos' });
    }

    // Sesión opcional: no romper si falta
    let usuario = null;
    try { 
      usuario = await getUsuarioFromRequest(req); 
    } catch (e) {
      console.log('No se pudo obtener usuario de la sesión:', e.message);
    }

    const conn = await pool.getConnection();

    try {
      // 1) Obtener información básica de la tarea
      const [tareas] = await conn.query(
        `SELECT id, titulo, descripcion, tema_id 
         FROM tareas 
         WHERE id = ? AND curso_id = ?`,
        [tareaId, cursoId]
      );

      if (!tareas.length) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      const tarea = tareas[0];

      // 2) Obtener calificación del estudiante si está autenticado
      let calificacion = null;
      if (usuario?.id) {
        const [entregas] = await conn.query(
          `SELECT calificacion 
           FROM tareas_entregas 
           WHERE tarea_id = ? AND estudiante_id = ? 
           ORDER BY id DESC LIMIT 1`,
          [tareaId, usuario.id]
        );
        calificacion = entregas[0]?.calificacion ?? null;
      }

      // 3) Definir tema desde el título (fallback: usa descripción)
      const baseTexto = (tarea.titulo || tarea.descripcion || '').trim();
      const temaSlug = slugify(baseTexto);

      // 4) Buscar recursos internos por tema
      let recursos = [];
      try {
        const [recursosDB] = await conn.query(
          `SELECT r.id, r.fuente, r.url, r.titulo, r.descripcion, r.licencia, r.dificultad
           FROM recursos r
           JOIN recurso_tema rt ON rt.recurso_id = r.id
           WHERE rt.tema_slug = ?
           ORDER BY r.dificultad ASC, r.id DESC
           LIMIT 10`,
          [temaSlug]
        );
        recursos = recursosDB || [];
      } catch (e) {
        console.error('Error al buscar recursos internos:', e);
        // Continuar con recursos vacíos en caso de error
      }

      // 5) Preparar respuesta
      const payload = {
        tarea: { 
          id: tareaId, 
          curso_id: cursoId, 
          titulo: tarea.titulo, 
          tema_slug: temaSlug 
        },
        calificacion,
        recursos,
        fuente: recursos.length ? 'interno' : 'vacio',
        ms: Date.now() - t0
      };

      return res.status(200).json({ ok: true, data: payload });
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error('GET /api/recomendaciones error:', err);
    // No exponer detalles del error al cliente
    return res.status(500).json({ 
      ok: false, 
      error: 'Error al cargar recomendaciones',
      ms: Date.now() - t0
    });
  }
}
