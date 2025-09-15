import mysql from "mysql2/promise";
import { readSession } from "./_utils/session.js";

// Crear el pool (puedes mover esto a un archivo separado si prefieres reutilizarlo)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
});

/* ===== Helpers ===== */
// This function is kept for backward compatibility but should be phased out
async function getUserId(req) {
  const session = await readSession(req);
  return session?.id || null;
}

function resolveCursoId(req, { allowBody = true } = {}) {
  const q = req.query || {};
  const b = allowBody ? (req.body || {}) : {};
  const raw =
    q.curso_id ?? q.course_id ?? q.id ?? q.cid ??
    b.curso_id ?? b.course_id ?? b.id ?? b.cid ?? null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function isProfesor(userId, cursoId) {
  if (!userId) return false;
  
  const [[u]] = await pool.query('SELECT rol FROM usuarios WHERE id=?', [userId]);
  if (!u) return false;
  
  if (u.rol === 'admin') return true;
  if (u.rol === 'profesor') {
    if (!cursoId) return true;
    const [[c]] = await pool.query('SELECT 1 FROM cursos WHERE id=? AND profesor_id=?', [cursoId, userId]);
    return !!c;
  }
  return false;
}

async function getTarea(conn, tareaId) {
  const [[row]] = await conn.query('SELECT * FROM tareas WHERE id = ?', [tareaId]);
  return row || null;
}

async function getCursoIdByTarea(tareaId) {
  const tarea = await getTarea(pool, tareaId);
  return tarea?.curso_id ?? null;
}

async function getColumns(table) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [table]
  );
  const set = new Set(rows.map(r => r.COLUMN_NAME));
  return { has: (c) => set.has(c), set };
}

/* ===== Handler ===== */
export default async function handler(req, res) {
  // Verificar sesión
  const session = await readSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const userId = session.id;
  const userRol = session.rol;

  const { action } = req.query;

  try {
    // ---------- LISTAR ----------
    if (req.method === 'GET' && action === 'listar') {
      const curso_id = resolveCursoId(req, { allowBody: false });
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
      
      // Verificar permisos: profesor del curso o estudiante inscrito
      const esProfesor = await isProfesor(userId, curso_id);
      if (!esProfesor) {
        // Si no es profesor, verificar si es estudiante inscrito
        const [[inscripcion]] = await pool.query(
          'SELECT 1 FROM inscripciones WHERE estudiante_id = ? AND curso_id = ?',
          [userId, curso_id]
        );
        if (!inscripcion) {
          return res.status(403).json({ error: 'No tienes permiso para ver las tareas de este curso' });
        }
      }

      // Consulta mejorada para incluir profesor_id
      const [rows] = await pool.query(`
        SELECT
          t.id,
          t.curso_id,
          COALESCE(t.titulo,'(Sin título)') AS title,
          COALESCE(t.descripcion,'') AS description,
          t.fecha_limite AS due_at,
          COALESCE(t.puntos,0) AS points,
          t.completada AS status,
          t.fecha_creacion AS created_at,
          t.fecha_completacion AS updated_at,
          u.nombre AS profesor,
          c.profesor_id  -- ¡IMPORTANTE! Incluir el ID del profesor
        FROM tareas t
        LEFT JOIN cursos c ON t.curso_id = c.id
        LEFT JOIN usuarios u ON c.profesor_id = u.id
        WHERE t.curso_id = ?
        ORDER BY t.fecha_limite DESC
      `, [curso_id]);

      return res.status(200).json(rows);
    }

    // ---------- DETALLE (nuevo endpoint) ----------
    if (req.method === 'GET' && action === 'detalle') {
      const tarea_id = req.query.id || req.query.tarea_id;
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

      const tarea = await getTarea(pool, tarea_id);
      if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });

      // Verificar si el usuario tiene permiso para ver esta tarea
      const cursoId = tarea.curso_id;
      const esProfesor = await isProfesor(userId, cursoId);
      const esEstudiante = !esProfesor; // Simplificación: si no es profesor, asumimos que es estudiante
      
      // Si es estudiante, verificar que esté inscrito en el curso
      if (esEstudiante) {
        const [[inscripcion]] = await pool.query(
          'SELECT 1 FROM inscripciones WHERE estudiante_id = ? AND curso_id = ?',
          [userId, cursoId]
        );
        if (!inscripcion) {
          return res.status(403).json({ error: 'No estás inscrito en este curso' });
        }
      }

      // Consulta para obtener los detalles de la tarea
      const [rows] = await pool.query(`
        SELECT
          t.id,
          t.curso_id,
          COALESCE(t.titulo, '(Sin título)') AS title,
          COALESCE(t.descripcion, '') AS description,
          t.fecha_limite AS due_at,
          COALESCE(t.puntos, 0) AS points,
          t.completada AS status,
          t.fecha_creacion AS created_at,
          t.fecha_completacion AS updated_at,
          u.nombre AS profesor,
          c.profesor_id,
          c.nombre AS curso_nombre,
          te.calificacion,
          te.observacion,
          te.archivo_url,
          te.fecha_entrega
        FROM tareas t
        LEFT JOIN cursos c ON t.curso_id = c.id
        LEFT JOIN usuarios u ON c.profesor_id = u.id
        LEFT JOIN tareas_entregas te ON t.id = te.tarea_id AND te.estudiante_id = ?
        WHERE t.id = ?
      `, [esEstudiante ? userId : null, tarea_id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      const tareaData = rows[0];
      
      // Preparar la respuesta según el rol del usuario
      const response = {
        id: tareaData.id,
        curso_id: tareaData.curso_id,
        title: tareaData.title,
        description: tareaData.description,
        due_at: tareaData.due_at ? new Date(tareaData.due_at).toISOString() : null,
        points: tareaData.points,
        status: tareaData.status,
        created_at: tareaData.created_at ? new Date(tareaData.created_at).toISOString() : null,
        updated_at: tareaData.updated_at ? new Date(tareaData.updated_at).toISOString() : null,
        profesor: tareaData.profesor,
        curso_nombre: tareaData.curso_nombre,
        puede_editar: esProfesor,
        entrega: esEstudiante ? {
          calificacion: tareaData.calificacion,
          observacion: tareaData.observacion,
          archivo_url: tareaData.archivo_url,
          fecha_entrega: tareaData.fecha_entrega ? new Date(tareaData.fecha_entrega).toISOString() : null
        } : undefined
      };

      return res.status(200).json(response);
    }

    // ---------- CREAR (profesor/admin del curso) ----------
    if (req.method === 'POST' && action === 'crear') {
      const curso_id = resolveCursoId(req);
      const { titulo, descripcion=null, fecha_limite=null, puntos=0 } = req.body || {};
      
      // Solo profesores pueden crear tareas
      if (userRol !== 'profesor' && userRol !== 'admin') {
        return res.status(403).json({ error: 'Solo los profesores pueden crear tareas' });
      }

      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
      if (!await isProfesor(userId, curso_id)) {
        return res.status(403).json({ error: 'Solo el profesor puede crear tareas' });
      }

      const cols = await getColumns('tareas');
      const columns = ['curso_id']; const values = ['?']; const params = [curso_id];

      if (cols.has('titulo'))          { columns.push('titulo');          values.push('?'); params.push((titulo||'').trim()); }
      if (cols.has('descripcion'))     { columns.push('descripcion');     values.push('?'); params.push(descripcion); }
      if (cols.has('fecha_limite'))    { columns.push('fecha_limite');    values.push('?'); params.push(fecha_limite ? new Date(fecha_limite) : null); }
      if (cols.has('puntos'))          { columns.push('puntos');          values.push('?'); params.push(puntos ?? 0); }
      if (cols.has('estado'))          { columns.push('estado');          values.push('?'); params.push('pendiente'); }
      if (cols.has('fecha_creacion'))  { columns.push('fecha_creacion');  values.push('NOW()'); }

      const sql = `INSERT INTO tareas (${columns.join(',')}) VALUES (${values.join(',')})`;
      const [r] = await pool.query(sql, params);
      return res.status(201).json({ id: r.insertId, message: 'Tarea creada' });
    }

    // ---------- EDITAR (profesor/admin del curso) ----------
    if (req.method === 'PUT' && action === 'editar') {
      const { id, curso_id, titulo, descripcion, fecha_limite, puntos, estado } = req.body || {};
      
      // Solo profesores pueden editar tareas
      if (userRol !== 'profesor' && userRol !== 'admin') {
        return res.status(403).json({ error: 'Solo los profesores pueden editar tareas' });
      }
      if (!id) return res.status(400).json({ error: 'id requerido' });

      const cursoIdReal = curso_id ?? (await getCursoIdByTarea(id));
      if (!cursoIdReal) return res.status(404).json({ error: 'Tarea no encontrada' });
      if (!await isProfesor(userId, cursoIdReal)) {
        return res.status(403).json({ error: 'Solo el profesor puede editar tareas' });
      }

      const cols = await getColumns('tareas');
      const setParts = []; const params = [];

      if (cols.has('titulo')      && titulo      !== undefined) { setParts.push('titulo=?');       params.push(String(titulo).trim()); }
      if (cols.has('descripcion') && descripcion !== undefined) { setParts.push('descripcion=?');  params.push(descripcion); }
      if (cols.has('fecha_limite')&& fecha_limite!== undefined) { setParts.push('fecha_limite=?'); params.push(fecha_limite ? new Date(fecha_limite) : null); }
      if (cols.has('puntos')      && puntos      !== undefined) { setParts.push('puntos=?');       params.push(puntos); }
      if (cols.has('estado')      && estado      !== undefined) { setParts.push('estado=?');       params.push(estado); }
      if (cols.has('fecha_actualizacion')) { setParts.push('fecha_actualizacion=NOW()'); }

      if (!setParts.length) return res.status(400).json({ error: 'Nada para actualizar' });

      params.push(id);
      await pool.query(`UPDATE tareas SET ${setParts.join(', ')} WHERE id = ?`, params);
      return res.status(200).json({ ok: true });
    }

    // ---------- ELIMINAR (profesor/admin del curso) ----------
    if (req.method === 'DELETE' && action === 'eliminar') {
      let { tarea_id, curso_id } = req.query;
      
      // Solo profesores pueden eliminar tareas
      if (userRol !== 'profesor' && userRol !== 'admin') {
        return res.status(403).json({ error: 'Solo los profesores pueden eliminar tareas' });
      }
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

      if (!curso_id) {
        curso_id = await getCursoIdByTarea(tarea_id);
        if (!curso_id) return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      
      if (!await isProfesor(userId, curso_id)) {
        return res.status(403).json({ error: 'Solo el profesor puede eliminar tareas' });
      }

      await pool.query('DELETE FROM tareas WHERE id=?', [tarea_id]);
      return res.status(200).json({ message: 'Tarea eliminada' });
    }

    // Si llegamos aquí, la acción no es reconocida
    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en tareas API:', err);
    // No exponer detalles del error en producción
    const errorResponse = process.env.NODE_ENV === 'development' 
      ? { error: 'Error interno del servidor', details: err.message }
      : { error: 'Error interno del servidor' };
    return res.status(500).json(errorResponse);
  }
}