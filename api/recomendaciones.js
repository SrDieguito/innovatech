// ESM: handler que asegura q = nombre de la tarea
const mysql = require('mysql2/promise');
const { tareaToTema } = require('./_utils/text.js');
const { khanSearchES } = require('./_utils/khan.js');

// Función local para sanitizar consultas
function sanitizeQuery(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

async function obtenerTituloTareaDesdeAPI(req, { tareaId, cursoId }) {
  try {
    const proto =
      req.headers['x-forwarded-proto'] ||
      (req.headers['referer'] && new URL(req.headers['referer']).protocol.replace(':','')) ||
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
    // Adaptarse a estructuras típicas: {tarea:{titulo, descripcion}} OR directo {titulo, descripcion}
    const tarea = data?.tarea || data;
    const titulo = tarea?.titulo || tarea?.nombre || null;
    const descripcion = tarea?.descripcion || '';
    const q = [titulo, descripcion].filter(Boolean).join(' ');
    return sanitizeQuery(q);
  } catch (_) { return null; }
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

// Función mejorada para obtener recursos de Khan Academy
async function fetchKhanResources(titulo, descripcion, limit = 5) {
  try {
    console.log(`Buscando recursos en Khan Academy para: "${titulo}"`);
    const results = await khanSearchES('', titulo, descripcion);
    
    // Mapear los resultados al formato esperado
    return results.slice(0, limit).map(item => ({
      fuente: 'Khan Academy',
      url: item.url,
      titulo: item.titulo,
      descripcion: item.descripcion || item.resumen || 'Recurso educativo de Khan Academy',
      licencia: 'KhanAcademy',
      dificultad: null,
      enlaces: item.enlaces || []
    }));
  } catch (error) {
    console.error('Error al buscar en Khan Academy:', error);
    return [];
  }
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

export default async function handler(req, res) {
  const conn = await pool.getConnection();
  try {
    const qp = req.query || {};
    const tareaId = qp.tareaId || qp.tarea_id || qp.id || null;
    const cursoId = qp.cursoId || qp.curso_id || qp.curso || null;
    const estudianteId = qp.estudianteId || qp.estudiante_id || qp.estudiante || null;
    const lang = qp.lang || 'es';
    const action = qp.action || null; // compat

    // 1) Prioridad: si cliente envía q (preferimos nombre de la tarea)
    let consulta = sanitizeQuery(qp.q || '');

    // 2) Si q está vacío, derivarlo de la propia API de tareas (nombre + descripción)
    if (!consulta && tareaId) {
      consulta = await obtenerTituloTareaDesdeAPI(req, { tareaId, cursoId }) || '';
    }
    // 3) Último recurso: usar el id literal, para no devolver 400
    if (!consulta && tareaId) consulta = String(tareaId);
    if (!consulta) {
      return res.status(400).json({ error: 'Falta q o tareaId' });
    }
    
    // Verificar sesión
    const session = await verifySession(req);
    if (!session.autenticado) {
      return okJson(res, { error: 'No autenticado' }, 401);
    }

    // Obtener tarea si se proporciona tareaId
    let tarea = null;
    
    if (tareaId) {
      tarea = await getTarea(conn, tareaId);
      if (!tarea) {
        return okJson(res, { error: 'Tarea no encontrada' }, 404);
      }
      
      // Si no hay consulta explícita, usar título y descripción de la tarea
      if (!consulta) {
        consulta = [tarea.titulo, tarea.descripcion].filter(Boolean).join(' ');
      }
      
      // Verificar calificación si se proporciona estudianteId
      if (estudianteId) {
        const calificacion = await getCalificacion(conn, tareaId, estudianteId);
        if (calificacion === null || calificacion > 7) {
          return okJson(res, {
            mostrar: false,
            motivo: 'Sin recomendaciones (no cumple condición ≤ 7 o no hay calificación).',
            calificacion
          });
        }
      }
    }

    if (!consulta) {
      return okJson(res, { error: 'Se requiere un término de búsqueda (q) o un ID de tarea' }, 400);
    }

    // 2) No se incluyen resultados de Wikimedia
    const wikimediaItems = [];

    // Obtener recursos internos si hay una tarea
    let recursosInternos = [];
    if (tarea) {
      const temaId = await ensureTemaFromTarea(conn, tarea);
      if (temaId) {
        recursosInternos = await getRecursosInternosPorTema(conn, temaId, 5);
      }
    }

    // Obtener recursos de Khan Academy
    let khanResources = [];
    try {
      khanResources = await fetchKhanResources(
        tarea?.titulo || consulta,
        tarea?.descripcion || '',
        5
      );
    } catch (error) {
      console.error('Error al obtener recursos de Khan Academy:', error);
      // Continuar sin recursos de Khan Academy
    }

    // Combinar todos los recursos
    const todosRecursos = [
      ...recursosInternos,
      ...khanResources,
      ...wikimediaItems
    ];

    return okJson(res, {
      mostrar: true,
      calificacion: null,
      tema_id: null,
      recursos: todosRecursos,
      meta: {
        total: todosRecursos.length,
        wikimedia: wikimediaItems.length,
        khan: khanResources.length,
        internos: recursosInternos.length
      }
    });

  } catch (err) {
    console.error('Error en handler de recomendaciones:', err);
    return okJson(res, { error: 'Error interno del servidor' }, 500);
  } finally {
    if (conn) conn.release();
  }
}
