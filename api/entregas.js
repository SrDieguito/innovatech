// api/entregas.js
import multer from 'multer';
import { pool } from './db.js';

/* ===== Helpers ===== */
function getUserId(req) {
  return req.cookies?.user_id || null;
}

async function canSubmit(userId, tareaId) {
  // verifica que la tarea pertenece a un curso donde el estudiante está matriculado
  const [[row]] = await pool.query(
    `SELECT 1
       FROM tareas t
       JOIN cursos_estudiantes ce ON ce.curso_id = t.curso_id AND ce.estudiante_id = ?
      WHERE t.id = ?
      LIMIT 1`,
    [userId, tareaId]
  );
  return !!row;
}

// Multer en memoria, límite 2 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Adaptador para usar multer como promesa
function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('archivo')(req, res, (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

export default async function handler(req, res) {
  const { action } = req.query || {};

  try {
    /* ===== SUBIR ENTREGA (estudiante) ===== */
    if (req.method === 'POST' && action === 'subir') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      // parse multipart
      try {
        await runMulter(req, res);
      } catch (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'El archivo supera 2 MB' });
        }
        return res.status(400).json({ error: 'Archivo inválido', details: err.message });
      }

      const tarea_id = Number(req.body?.tarea_id);
      const file = req.file;

      if (!tarea_id || !file) {
        return res.status(400).json({ error: 'Faltan datos: tarea_id y archivo son requeridos' });
      }

      // seguridad: confirmar que puede entregar esa tarea
      if (!await canSubmit(userId, tarea_id)) {
        return res.status(403).json({ error: 'No puedes entregar esta tarea' });
      }

      const nombre = file.originalname || 'archivo';
      const mime = file.mimetype || 'application/octet-stream';
      const buffer = file.buffer;
      const bytes = file.size;

      // upsert
      const [[ex]] = await pool.query(
        'SELECT id FROM tareas_entregas WHERE tarea_id = ? AND estudiante_id = ? LIMIT 1',
        [tarea_id, userId]
      );

      if (ex?.id) {
        await pool.query(
          `UPDATE tareas_entregas
             SET archivo_nombre=?, archivo_mime=?, archivo_blob=?, tamano_bytes=?, fecha_entrega=NOW(), estado='entregado'
           WHERE id=?`,
          [nombre, mime, buffer, bytes, ex.id]
        );
        return res.status(200).json({ ok: true, id: ex.id, message: 'Entrega actualizada' });
      } else {
        const [ins] = await pool.query(
          `INSERT INTO tareas_entregas
             (tarea_id, estudiante_id, archivo_nombre, archivo_mime, archivo_blob, tamano_bytes, estado)
           VALUES (?,?,?,?,?,?, 'entregado')`,
          [tarea_id, userId, nombre, mime, buffer, bytes]
        );
        return res.status(201).json({ ok: true, id: ins.insertId, message: 'Entrega registrada' });
      }
    }

    /* ===== LISTAR MIS ENTREGAS por curso ===== */
    if (req.method === 'GET' && action === 'listar') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const curso_id = Number(req.query?.curso_id);
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
      const [rows] = await pool.query(
        `SELECT e.tarea_id, e.archivo_nombre, e.tamano_bytes, e.fecha_entrega
           FROM tareas_entregas e
           JOIN tareas t ON t.id = e.tarea_id
          WHERE e.estudiante_id = ? AND t.curso_id = ?
          ORDER BY e.fecha_entrega DESC`,
        [userId, curso_id]
      );
      return res.status(200).json({ entregas: rows });
    }

    /* ===== DETALLE de mi entrega (última) ===== */
    if (req.method === 'GET' && action === 'detalle') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const tarea_id = Number(req.query?.tarea_id);
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });
      // seguridad: debe poder entregar esa tarea
      if (!await canSubmit(userId, tarea_id)) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      const [[row]] = await pool.query(
        `SELECT id, tarea_id, archivo_nombre, tamano_bytes, fecha_entrega
           FROM tareas_entregas
          WHERE tarea_id=? AND estudiante_id=?
          ORDER BY fecha_entrega DESC
          LIMIT 1`,
        [tarea_id, userId]
      );
      if (!row) return res.status(404).json({ error: 'No hay entrega' });
      return res.status(200).json({ entrega: row });
    }

    /* ===== ELIMINAR mi entrega ===== */
    if (req.method === 'DELETE' && action === 'eliminar') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const tarea_id = Number(req.query?.tarea_id);
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });
      if (!await canSubmit(userId, tarea_id)) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      const [r] = await pool.query(
        `DELETE FROM tareas_entregas
          WHERE tarea_id=? AND estudiante_id=?`,
        [tarea_id, userId]
      );
      return res.status(200).json({ ok: true, deleted: r.affectedRows });
    }

    /* ===== DESCARGAR ÚLTIMA ENTREGA (opcional) ===== */
    if (req.method === 'GET' && action === 'descargar') {
      const userId = getUserId(req);
      const tarea_id = Number(req.query?.tarea_id);
      const estudiante_id = Number(req.query?.estudiante_id) || userId;

      if (!tarea_id || !estudiante_id) return res.status(400).json({ error: 'tarea_id requerido' });

      const [[row]] = await pool.query(
        `SELECT archivo_nombre, archivo_mime, archivo_blob 
           FROM tareas_entregas 
          WHERE tarea_id=? AND estudiante_id=? 
          ORDER BY fecha_entrega DESC 
          LIMIT 1`,
        [tarea_id, estudiante_id]
      );
      if (!row) return res.status(404).json({ error: 'No hay entrega' });

      res.setHeader('Content-Type', row.archivo_mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${row.archivo_nombre || 'entrega'}"`);
      return res.status(200).send(row.archivo_blob);
    }

    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en entregas API:', err);
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
