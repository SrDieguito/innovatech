import { pool } from './db.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function runMulter(req, res) {
  return new Promise((resolve, reject) =>
    upload.single('archivo')(req, res, err => err ? reject(err) : resolve())
  );
}

function getUserId(req) {
  return req.cookies?.user_id || null;
}

async function isProfesorDelCurso(userId, cursoId) {
  if (!userId || !cursoId) return false;
  const [[u]] = await pool.query('SELECT rol FROM usuarios WHERE id=?', [userId]);
  if (!u) return false;
  if (u.rol === 'admin') return true;
  if (u.rol === 'profesor') {
    const [[c]] = await pool.query('SELECT 1 FROM cursos WHERE id=? AND profesor_id=?', [cursoId, userId]);
    return !!c;
  }
  return false;
}

async function puedeVerCurso(userId, cursoId) {
  if (!userId || !cursoId) return false;
  const [[u]] = await pool.query('SELECT rol FROM usuarios WHERE id=?', [userId]);
  if (!u) return false;
  if (u.rol === 'admin') return true;
  if (u.rol === 'profesor') {
    const [[c]] = await pool.query('SELECT 1 FROM cursos WHERE id=? AND profesor_id=?', [cursoId, userId]);
    return !!c;
  }
  const [[e]] = await pool.query(
    'SELECT 1 FROM cursos_estudiantes WHERE curso_id=? AND estudiante_id=?', [cursoId, userId]
  );
  return !!e;
}

export default async function handler(req, res) {
  const action   = req.query?.action || '';
  const curso_id = Number(req.query?.curso_id || req.body?.curso_id || 0);
  const userId   = getUserId(req);

  try {
    // GET listar
    if (req.method === 'GET' && action === 'listar') {
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
      if (!userId || !await puedeVerCurso(userId, curso_id))
        return res.status(403).json({ error: 'No autorizado' });

      const [rows] = await pool.query(
        `SELECT id, titulo, descripcion, archivo_nombre, archivo_mime, tamano_bytes,
                tipo, url_externa, orden, fecha_creacion
         FROM materiales WHERE curso_id = ? ORDER BY orden ASC, fecha_creacion ASC`,
        [curso_id]
      );
      return res.json(rows);
    }

    // POST subir
    if (req.method === 'POST' && action === 'subir') {
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
      if (!userId || !await isProfesorDelCurso(userId, curso_id))
        return res.status(403).json({ error: 'Solo el profesor puede subir materiales' });

      try { await runMulter(req, res); }
      catch (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'El archivo supera 10 MB' });
        return res.status(400).json({ error: 'Error al procesar el archivo' });
      }

      const { titulo, descripcion, tipo = 'archivo', url_externa, orden = 0 } = req.body || {};
      if (!titulo?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });

      if (tipo === 'enlace') {
        if (!url_externa?.trim()) return res.status(400).json({ error: 'La URL es obligatoria para enlaces' });
        const [rows] = await pool.query(
          `INSERT INTO materiales (curso_id, titulo, descripcion, tipo, url_externa, orden)
           VALUES (?, ?, ?, 'enlace', ?, ?) RETURNING id`,
          [curso_id, titulo.trim(), descripcion || null, url_externa.trim(), Number(orden)]
        );
        return res.status(201).json({ ok: true, id: rows[0]?.id });
      }

      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Archivo requerido' });

      const [rows] = await pool.query(
        `INSERT INTO materiales (curso_id, titulo, descripcion, archivo_nombre, archivo_mime, archivo_blob, tamano_bytes, tipo, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'archivo', ?) RETURNING id`,
        [curso_id, titulo.trim(), descripcion || null, file.originalname, file.mimetype, file.buffer, file.size, Number(orden)]
      );
      return res.status(201).json({ ok: true, id: rows[0]?.id });
    }

    // GET descargar
    if (req.method === 'GET' && action === 'descargar') {
      const id = Number(req.query?.id);
      if (!id) return res.status(400).json({ error: 'id requerido' });

      const [[row]] = await pool.query(
        'SELECT curso_id, archivo_nombre, archivo_mime, archivo_blob FROM materiales WHERE id=?', [id]
      );
      if (!row) return res.status(404).json({ error: 'Material no encontrado' });
      if (!userId || !await puedeVerCurso(userId, row.curso_id))
        return res.status(403).json({ error: 'No autorizado' });
      if (!row.archivo_blob) return res.status(404).json({ error: 'Sin archivo adjunto' });

      const encoded = encodeURIComponent(row.archivo_nombre || 'archivo');
      const ascii   = (row.archivo_nombre || 'archivo').replace(/[^\x00-\x7F]/g, '_');
      res.setHeader('Content-Type', row.archivo_mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`);
      return res.send(row.archivo_blob);
    }

    // DELETE eliminar
    if (req.method === 'DELETE' && action === 'eliminar') {
      const id = Number(req.query?.id);
      if (!id) return res.status(400).json({ error: 'id requerido' });
      const [[row]] = await pool.query('SELECT curso_id FROM materiales WHERE id=?', [id]);
      if (!row) return res.status(404).json({ error: 'Material no encontrado' });
      if (!userId || !await isProfesorDelCurso(userId, row.curso_id))
        return res.status(403).json({ error: 'No autorizado' });
      await pool.query('DELETE FROM materiales WHERE id=?', [id]);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción inválida' });
  } catch (err) {
    console.error('Error en materiales API:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
