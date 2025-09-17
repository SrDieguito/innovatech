// api/recomendaciones.js
import mysql from 'mysql2/promise';
import { tareaToTema } from './_utils/text.js';
import { khanSearchES } from './_utils/khan.js';

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
  try {
    if (req.method !== 'GET') return okJson(res, { error: 'Método no permitido' }, 405);
    
    const { action } = req.query;
    if (action !== 'por-tarea') return okJson(res, { error: 'Acción no soportada' }, 400);

    const tarea_id = Number(req.query.tarea_id);
    if (!Number.isInteger(tarea_id) || tarea_id <= 0) {
      return okJson(res, { error: 'tarea_id inválido' }, 400);
    }

    // Verificar sesión del usuario
    const session = await verifySession(req);
    if (!session.autenticado || !session.usuario?.id) {
      return okJson(res, { 
        mostrar: false, 
        motivo: session.mensaje || 'Inicia sesión para ver recomendaciones.',
        calificacion: null
      }, 401);
    }
    
    const estudiante_id = Number(session.usuario.id);

    const conn = await pool.getConnection();
    try {
      const tarea = await getTarea(conn, tarea_id);
      if (!tarea) return okJson(res, { error: 'Tarea no existe' }, 404);

      const calificacion = await getCalificacion(conn, tarea_id, estudiante_id);

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

      // Completar con recursos de Khan Academy si es necesario
      if (recursos.length < 5) {
        const khanResources = await fetchKhanResources(
          tarea.titulo, 
          tarea.descripcion, 
          5 - recursos.length
        );
        recursos = [...recursos, ...khanResources];
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
