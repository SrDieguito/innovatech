import mysql from 'mysql2/promise';
import multer from 'multer';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* ===== Helpers ===== */
function getUserId(req) {
  return req.cookies?.user_id || null;
}

async function canSubmit(userId, tareaId) {
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
        `SELECT e.tarea_id, e.archivo_nombre, e.tamano_bytes, e.fecha_entrega, e.estado
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
        `SELECT id, tarea_id, archivo_nombre, tamano_bytes, fecha_entrega, estado
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

    /* ===== DESCARGAR ===== */
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

      const nombreArchivo = row.archivo_nombre || 'entrega';
      const encodedName = encodeURIComponent(nombreArchivo);
      const asciiName = nombreArchivo.replace(/[^\x00-\x7F]/g, '_');

      res.setHeader('Content-Type', row.archivo_mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);

      return res.status(200).send(row.archivo_blob);
    }

    /* ===== OBTENER CALIFICACIÓN (estudiante) ===== */
if (req.method === 'GET' && action === 'obtener_calificacion') {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  const tarea_id = Number(req.query?.tarea_id);
  if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

  // Verificar que el estudiante puede acceder a esta calificación
  if (!await canSubmit(userId, tarea_id)) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const [[calificacion]] = await pool.query(
    `SELECT calificacion, observacion, estado 
     FROM tareas_entregas 
     WHERE tarea_id = ? AND estudiante_id = ? 
     ORDER BY fecha_entrega DESC 
     LIMIT 1`,
    [tarea_id, userId]
  );

  if (!calificacion) {
    return res.status(404).json({ error: 'No hay calificación disponible' });
  }

  return res.status(200).json({ calificacion });
}
/* ===== LISTAR ENTREGAS POR TAREA (profesor) ===== */
if (req.method === 'GET' && action === 'listar_por_tarea_profesor') {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  const tarea_id = Number(req.query?.tarea_id);
  if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

  // Verificar que el usuario es profesor del curso de la tarea
  const [[verificacion]] = await pool.query(
    `SELECT c.profesor_id 
     FROM tareas t 
     JOIN cursos c ON t.curso_id = c.id 
     WHERE t.id = ?`,
    [tarea_id]
  );

  if (!verificacion) return res.status(404).json({ error: 'Tarea no encontrada' });
  
  // Verificar rol del usuario
  const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
  if (!user) return res.status(403).json({ error: 'Usuario no encontrado' });

  // Convertir userId a número para comparar
  const userIdNum = Number(userId);
  const profesorIdNum = Number(verificacion.profesor_id);

  if (profesorIdNum !== userIdNum && user.rol !== 'admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  // Obtener todas las entregas para esta tarea
  const [entregas] = await pool.query(
    `SELECT e.*, u.nombre as estudiante_nombre, u.email as estudiante_email
     FROM tareas_entregas e
     JOIN usuarios u ON e.estudiante_id = u.id
     WHERE e.tarea_id = ?
     ORDER BY e.fecha_entrega DESC`,
    [tarea_id]
  );

  return res.status(200).json({ entregas });
}

    /* ===== CALIFICAR ENTREGA (profesor) ===== */
   if (req.method === 'POST' && action === 'calificar') {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  const { entrega_id, calificacion, observacion } = req.body;

  if (!entrega_id) return res.status(400).json({ error: 'entrega_id requerido' });

  // Verificar que el usuario es profesor del curso de la tarea
  const [[verificacion]] = await pool.query(
    `SELECT c.profesor_id, t.curso_id
     FROM tareas_entregas e
     JOIN tareas t ON e.tarea_id = t.id
     JOIN cursos c ON t.curso_id = c.id
     WHERE e.id = ?`,
    [entrega_id]
  );

  if (!verificacion) return res.status(404).json({ error: 'Entrega no encontrada' });
  
// Verificar rol del usuario
const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
if (!user) return res.status(403).json({ error: 'Usuario no encontrado' });

// Convertir a números para comparación adecuada
const userIdNum = Number(userId);
const profesorIdNum = Number(verificacion.profesor_id);

// Permitir si es admin O si es profesor Y es el profesor del curso
const puedeCalificar = user.rol === 'admin' || 
                      (user.rol === 'profesor' && profesorIdNum === userIdNum);

  // Actualizar la calificación y observación
  await pool.query(
    `UPDATE tareas_entregas 
     SET calificacion = ?, observacion = ?, estado = 'revisado'
     WHERE id = ?`,
    [calificacion, observacion, entrega_id]
  );

  return res.status(200).json({ ok: true });
}
    return res.status(400).json({ error: 'Acción inválida o método no soportado' });

  } catch (err) {
    console.error('Error en entregas API:', err);
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }

      /* ===== EXPORTAR CALIFICACIONES (profesor) ===== */
    if (req.method === 'GET' && action === 'exportar_calificaciones') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const tarea_id = Number(req.query?.tarea_id);
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

      // Verificar que el usuario es profesor del curso de la tarea
      const [[verificacion]] = await pool.query(
        `SELECT c.profesor_id 
         FROM tareas t 
         JOIN cursos c ON t.curso_id = c.id 
         WHERE t.id = ?`,
        [tarea_id]
      );

      if (!verificacion) return res.status(404).json({ error: 'Tarea no encontrada' });
      
      // Verificar rol del usuario
      const [[user]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
      if (!user) return res.status(403).json({ error: 'Usuario no encontrado' });

      const userIdNum = Number(userId);
      const profesorIdNum = Number(verificacion.profesor_id);

      if (profesorIdNum !== userIdNum && user.rol !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Obtener todas las entregas para esta tarea
      const [entregas] = await pool.query(
        `SELECT 
           u.nombre as estudiante_nombre, 
           u.email as estudiante_email,
           e.archivo_nombre,
           e.fecha_entrega,
           e.calificacion,
           e.observacion
         FROM tareas_entregas e
         JOIN usuarios u ON e.estudiante_id = u.id
         WHERE e.tarea_id = ?
         ORDER BY e.fecha_entrega DESC`,
        [tarea_id]
      );

      // Si no hay entregas, devolver error o un Excel vacío?
      if (!entregas.length) {
        return res.status(404).json({ error: 'No hay entregas para esta tarea' });
      }

      // Importar la librería xlsx (asegúrate de tenerla instalada)
      const XLSX = require('xlsx');

      // Preparar los datos para la hoja de cálculo
      const datos = entregas.map(entrega => ({
        'Estudiante': entrega.estudiante_nombre,
        'Email': entrega.estudiante_email,
        'Archivo': entrega.archivo_nombre,
        'Fecha de entrega': entrega.fecha_entrega,
        'Calificación': entrega.calificacion || 'No calificado',
        'Observaciones': entrega.observacion || ''
      }));

      // Crear un nuevo libro y una hoja
      const libro = XLSX.utils.book_new();
      const hoja = XLSX.utils.json_to_sheet(datos);

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(libro, hoja, 'Calificaciones');

      // Escribir el libro a un buffer
      const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });

      // Configurar los headers de la respuesta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="calificaciones_tarea_${tarea_id}.xlsx"`);

      // Enviar el buffer
      return res.status(200).send(buffer);
    }

  
}