import { pool } from './db.js';
import multer from 'multer';
import ExcelJS from 'exceljs';

async function canSubmit(userId, tareaId) {
  const [[row]] = await pool.query(
    `SELECT 1 FROM tareas t
     JOIN cursos_estudiantes ce ON ce.curso_id = t.curso_id AND ce.estudiante_id = ?
     WHERE t.id = ? LIMIT 1`,
    [userId, tareaId]
  );
  return !!row;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('archivo')(req, res, (err) => { if (err) reject(err); else resolve(); });
  });
}

function getUserId(req) {
  return req.cookies?.user_id || null;
}

export default async function handler(req, res) {
  const { action } = req.query || {};

  try {
    /* ===== SUBIR ENTREGA ===== */
    if (req.method === 'POST' && action === 'subir') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      try {
        await runMulter(req, res);
      } catch (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'El archivo supera 2 MB' });
        return res.status(400).json({ error: 'Archivo inválido', details: err.message });
      }

      const tarea_id = Number(req.body?.tarea_id);
      const file = req.file;
      if (!tarea_id || !file) return res.status(400).json({ error: 'Faltan datos: tarea_id y archivo son requeridos' });
      if (!await canSubmit(userId, tarea_id)) return res.status(403).json({ error: 'No puedes entregar esta tarea' });

      const nombre = file.originalname || 'archivo';
      const mime = file.mimetype || 'application/octet-stream';
      const buffer = file.buffer;
      const bytes = file.size;

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
        const [rows] = await pool.query(
          `INSERT INTO tareas_entregas
             (tarea_id, estudiante_id, archivo_nombre, archivo_mime, archivo_blob, tamano_bytes, estado)
           VALUES (?,?,?,?,?,?,'entregado') RETURNING id`,
          [tarea_id, userId, nombre, mime, buffer, bytes]
        );
        return res.status(201).json({ ok: true, id: rows[0]?.id, message: 'Entrega registrada' });
      }
    }

    /* ===== LISTAR MIS ENTREGAS ===== */
    if (req.method === 'GET' && action === 'listar') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const curso_id = Number(req.query?.curso_id);
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });

      const [rows] = await pool.query(
        `SELECT e.tarea_id, e.archivo_nombre, e.tamano_bytes, e.fecha_entrega, e.estado
         FROM tareas_entregas e
         JOIN tareas t ON t.id = e.tarea_id
         WHERE e.estudiante_id = ? AND t.curso_id = ?
         ORDER BY e.fecha_entrega DESC`,
        [userId, curso_id]
      );
      return res.status(200).json({ entregas: rows });
    }

    /* ===== DETALLE DE ENTREGA ===== */
    if (req.method === 'GET' && action === 'detalle') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const tarea_id = Number(req.query?.tarea_id || req.query?.id || req.query?.tareaId);
      if (!tarea_id) return res.status(400).json({ error: 'ID de tarea requerido' });
      if (!await canSubmit(userId, tarea_id)) return res.status(403).json({ error: 'No tienes permiso para ver esta entrega' });

      const [[row]] = await pool.query(
        `SELECT id, tarea_id, archivo_nombre, tamano_bytes, fecha_entrega, estado, calificacion, observacion
         FROM tareas_entregas WHERE tarea_id=? AND estudiante_id=?
         ORDER BY fecha_entrega DESC LIMIT 1`,
        [tarea_id, userId]
      );
      if (!row) return res.status(404).json({ error: 'No se encontró ninguna entrega para esta tarea' });
      return res.status(200).json({ entrega: row });
    }

    /* ===== ELIMINAR ENTREGA ===== */
    if (req.method === 'DELETE' && action === 'eliminar') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const tarea_id = Number(req.query?.tarea_id);
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });
      if (!await canSubmit(userId, tarea_id)) return res.status(403).json({ error: 'No autorizado' });

      const [r] = await pool.query(
        'DELETE FROM tareas_entregas WHERE tarea_id=? AND estudiante_id=?',
        [tarea_id, userId]
      );
      return res.status(200).json({ ok: true, deleted: r.affectedRows });
    }

    /* ===== DESCARGAR ===== */
    if (req.method === 'GET' && action === 'descargar') {
      const userId = getUserId(req);
      const tarea_id = Number(req.query?.tarea_id);
      const estudiante_id = Number(req.query?.estudiante_id) || userId;
      if (!tarea_id || !estudiante_id) return res.status(400).json({ error: 'tarea_id requerido' });

      const [[row]] = await pool.query(
        `SELECT archivo_nombre, archivo_mime, archivo_blob
         FROM tareas_entregas WHERE tarea_id=? AND estudiante_id=?
         ORDER BY fecha_entrega DESC LIMIT 1`,
        [tarea_id, estudiante_id]
      );
      if (!row) return res.status(404).json({ error: 'No hay entrega' });

      const encodedName = encodeURIComponent(row.archivo_nombre || 'entrega');
      const asciiName = (row.archivo_nombre || 'entrega').replace(/[^\x00-\x7F]/g, '_');
      res.setHeader('Content-Type', row.archivo_mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);
      return res.status(200).send(row.archivo_blob);
    }

    /* ===== OBTENER CALIFICACIÓN ===== */
    if (req.method === 'GET' && action === 'obtener_calificacion') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const tarea_id = Number(req.query?.tarea_id);
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });
      if (!await canSubmit(userId, tarea_id)) return res.status(403).json({ error: 'No autorizado' });

      const [[calificacion]] = await pool.query(
        `SELECT calificacion, observacion, estado FROM tareas_entregas
         WHERE tarea_id = ? AND estudiante_id = ? ORDER BY fecha_entrega DESC LIMIT 1`,
        [tarea_id, userId]
      );
      if (!calificacion) return res.status(404).json({ error: 'No hay calificación disponible' });
      return res.status(200).json({ calificacion });
    }

    /* ===== LISTAR ENTREGAS POR TAREA (profesor) ===== */
    if (req.method === 'GET' && action === 'listar_por_tarea_profesor') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const tarea_id = Number(req.query?.tarea_id);
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

      const [[verificacion]] = await pool.query(
        'SELECT c.profesor_id FROM tareas t JOIN cursos c ON t.curso_id = c.id WHERE t.id = ?',
        [tarea_id]
      );
      if (!verificacion) return res.status(404).json({ error: 'Tarea no encontrada' });

      const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
      if (!user) return res.status(403).json({ error: 'Usuario no encontrado' });

      if (Number(verificacion.profesor_id) !== Number(userId) && user.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const [entregas] = await pool.query(
        `SELECT DISTINCT ON (e.estudiante_id)
           e.id, e.tarea_id, e.estudiante_id, e.archivo_nombre, e.archivo_mime,
           e.tamano_bytes, e.estado, e.fecha_entrega, e.calificacion, e.observacion,
           u.nombre AS estudiante_nombre, u.email AS estudiante_email
         FROM tareas_entregas e JOIN usuarios u ON e.estudiante_id = u.id
         WHERE e.tarea_id = ?
         ORDER BY e.estudiante_id, e.fecha_entrega DESC`,
        [tarea_id]
      );
      return res.status(200).json({ entregas });
    }

    /* ===== CALIFICAR (profesor) ===== */
    if (req.method === 'POST' && action === 'calificar') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const { entrega_id, calificacion, observacion } = req.body;
      if (!entrega_id) return res.status(400).json({ error: 'entrega_id requerido' });

      const [[verificacion]] = await pool.query(
        `SELECT c.profesor_id FROM tareas_entregas e
         JOIN tareas t ON e.tarea_id = t.id JOIN cursos c ON t.curso_id = c.id
         WHERE e.id = ?`,
        [entrega_id]
      );
      if (!verificacion) return res.status(404).json({ error: 'Entrega no encontrada' });

      const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
      if (!user) return res.status(403).json({ error: 'Usuario no encontrado' });

      const puedeCalificar = user.rol === 'admin' ||
        (user.rol === 'profesor' && Number(verificacion.profesor_id) === Number(userId));
      if (!puedeCalificar) return res.status(403).json({ error: 'No autorizado para calificar' });

      await pool.query(
        `UPDATE tareas_entregas SET calificacion = ?, observacion = ?, estado = 'revisado' WHERE id = ?`,
        [calificacion, observacion, entrega_id]
      );
      return res.status(200).json({ ok: true });
    }

    /* ===== EXPORTAR CALIFICACIONES ===== */
    if (req.method === 'GET' && action === 'exportar_calificaciones') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const tarea_id = Number(req.query?.tarea_id);
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

      const [[verificacion]] = await pool.query(
        'SELECT c.profesor_id FROM tareas t JOIN cursos c ON t.curso_id = c.id WHERE t.id = ?',
        [tarea_id]
      );
      if (!verificacion) return res.status(404).json({ error: 'Tarea no encontrada' });

      const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
      if (Number(verificacion.profesor_id) !== Number(userId) && user?.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const [[tareaInfo]] = await pool.query(
        'SELECT t.titulo, c.nombre AS curso_nombre FROM tareas t JOIN cursos c ON t.curso_id = c.id WHERE t.id = ?',
        [tarea_id]
      );

      const [entregas] = await pool.query(
        `SELECT u.nombre AS estudiante_nombre, u.email AS estudiante_email,
                e.archivo_nombre, e.fecha_entrega, e.calificacion, e.observacion, e.estado
         FROM tareas_entregas e JOIN usuarios u ON e.estudiante_id = u.id
         WHERE e.tarea_id = ? ORDER BY u.nombre ASC`,
        [tarea_id]
      );
      if (!entregas.length) return res.status(404).json({ error: 'No hay entregas para esta tarea' });

      const datos = entregas.map(e => ({
        'Estudiante': e.estudiante_nombre, 'Email': e.estudiante_email,
        'Archivo': e.archivo_nombre, 'Fecha de entrega': e.fecha_entrega,
        'Calificación': e.calificacion !== null ? e.calificacion : 'No calificado',
        'Estado': e.estado, 'Observaciones': e.observacion || '',
      }));

      const workbook = new ExcelJS.Workbook();
      const hoja = workbook.addWorksheet('Calificaciones');
      hoja.columns = Object.keys(datos[0]).map(key => ({ header: key, key }));
      hoja.addRows(datos);
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="calificaciones_${tareaInfo.titulo.replace(/\s+/g, '_')}.xlsx"`);
      return res.status(200).send(buffer);
    }

    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en entregas API:', err);
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
