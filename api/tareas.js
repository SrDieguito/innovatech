import { pool } from './db.js';

// ---- helpers ----
async function isProfesor(userId, cursoId) {
  const [[u]] = await pool.query('SELECT rol FROM usuarios WHERE id=?', [userId]);
  if (!u) return false;
  if (u.rol === 'admin' || u.rol === 'profesor') {
    if (!cursoId) return true;
    const [[c]] = await pool.query(
      'SELECT 1 FROM cursos WHERE id=? AND profesor_id=?',
      [cursoId, userId]
    );
    return !!c;
  }
  return false;
}

function getUserId(req) {
  // Ajusta si tu cookie tiene otro nombre
  return req.cookies?.user_id || null;
}

async function getCursoIdByTarea(tareaId) {
  const [[row]] = await pool.query('SELECT curso_id FROM tareas WHERE id=?', [tareaId]);
  return row?.curso_id ?? null;
}

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // ================= CREAR TAREA =================
    if (req.method === 'POST' && action === 'crear') {
      const userId = getUserId(req);
      const { curso_id, titulo, descripcion, fecha_limite, puntos } = req.body;

      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      if (!curso_id || !titulo || !fecha_limite) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }
      if (!await isProfesor(userId, curso_id)) {
        return res.status(403).json({ error: 'Solo el profesor puede crear tareas' });
      }

      const [result] = await pool.query(
        `INSERT INTO tareas (curso_id, titulo, descripcion, fecha_limite, puntos, estado, fecha_creacion)
         VALUES (?, ?, ?, ?, ?, 'pendiente', NOW())`,
        [curso_id, String(titulo).trim(), descripcion ?? null, new Date(fecha_limite), puntos ?? 0]
      );

      return res.status(201).json({
        id: result.insertId,
        message: 'Tarea creada exitosamente'
      });
    }

    // ================= LISTAR TAREAS =================
    if (req.method === 'GET' && action === 'listar') {
      const { curso_id } = req.query;
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });

      const [rows] = await pool.query(`
        SELECT 
          id,
          curso_id,
          COALESCE(titulo, '(Sin título)')  AS title,
          COALESCE(descripcion, '')         AS description,
          fecha_limite                      AS due_at,
          COALESCE(puntos, 0)               AS points,
          COALESCE(estado, 'pendiente')     AS status
        FROM tareas
        WHERE curso_id = ?
        ORDER BY fecha_creacion DESC
      `, [curso_id]);

      return res.status(200).json(rows);
    }

    // ================= EDITAR TAREA =================
    if (req.method === 'PUT' && action === 'editar') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const { id, curso_id, titulo, descripcion, fecha_limite, puntos, estado } = req.body;
      if (!id) return res.status(400).json({ error: 'id requerido' });

      // Si no llega curso_id, lo inferimos desde la tarea
      const cursoIdReal = curso_id ?? (await getCursoIdByTarea(id));
      if (!cursoIdReal) return res.status(404).json({ error: 'Tarea no encontrada' });

      if (!await isProfesor(userId, cursoIdReal)) {
        return res.status(403).json({ error: 'Solo el profesor puede editar tareas' });
      }

      await pool.query(`
        UPDATE tareas SET 
          titulo        = COALESCE(?, titulo),
          descripcion   = ?,
          fecha_limite  = ?,
          puntos        = COALESCE(?, puntos),
          estado        = COALESCE(?, estado),
          fecha_actualizacion = NOW()
        WHERE id = ?
      `, [
        titulo != null ? String(titulo).trim() : null,
        descripcion ?? null,
        fecha_limite ? new Date(fecha_limite) : null,
        (puntos ?? null),
        estado ?? null,
        id
      ]);

      return res.status(200).json({ ok: true });
    }

    // ================= ELIMINAR TAREA =================
    if (req.method === 'DELETE' && action === 'eliminar') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      let { tarea_id, curso_id } = req.query;
      if (!tarea_id) return res.status(400).json({ error: 'Se requiere el ID de la tarea' });

      // Si no llega curso_id, lo inferimos
      if (!curso_id) {
        curso_id = await getCursoIdByTarea(tarea_id);
        if (!curso_id) return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      if (!await isProfesor(userId, curso_id)) {
        return res.status(403).json({ error: 'Solo el profesor puede eliminar tareas' });
      }

      await pool.query('DELETE FROM tareas WHERE id = ?', [tarea_id]);
      return res.status(200).json({ message: 'Tarea eliminada exitosamente' });
    }

    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en tareas API:', err);
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
