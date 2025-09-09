import mysql from "mysql2/promise";

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
function getUserId(req) {
  return req.cookies?.user_id || null; // ajusta si tu cookie se llama distinto
}

// --- NUEVO: normaliza la lectura del id de curso ---
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
  const [[u]] = await pool.query('SELECT rol FROM usuarios WHERE id=?', [userId]);
  if (!u) return false;
  if (u.rol === 'admin' || u.rol === 'profesor') {
    if (!cursoId) return true;
    const [[c]] = await pool.query('SELECT 1 FROM cursos WHERE id=? AND profesor_id=?', [cursoId, userId]);
    return !!c;
  }
  return false;
}

async function getCursoIdByTarea(tareaId) {
  const [[row]] = await pool.query('SELECT curso_id FROM tareas WHERE id=?', [tareaId]);
  return row?.curso_id ?? null;
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
  const { action } = req.query;

  try {
    // ---------- LISTAR ----------
    if (req.method === 'GET' && action === 'listar') {
      const curso_id = resolveCursoId(req, { allowBody: false });
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });

      const cols = await getColumns('tareas');
      const f_titulo   = cols.has('titulo')       ? "COALESCE(titulo,'(Sin título)')" : "'(Sin título)'";
      const f_desc     = cols.has('descripcion')  ? "COALESCE(descripcion,'')"        : "''";
      const f_due      = cols.has('fecha_limite') ? 'fecha_limite'                    : 'NULL';
      const f_points   = cols.has('puntos')       ? 'COALESCE(puntos,0)'              : '0';
      const f_status   = cols.has('estado')       ? "COALESCE(estado,'pendiente')"    : "'pendiente'";
      const f_created  = cols.has('fecha_creacion')      ? 'fecha_creacion'           : 'NULL';
      const f_updated  = cols.has('fecha_actualizacion') ? 'fecha_actualizacion'      : 'NULL';

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
      u.nombre AS profesor
    FROM tareas t
    LEFT JOIN cursos c ON t.curso_id = c.id
    LEFT JOIN usuarios u ON c.profesor_id = u.id
    WHERE t.curso_id = ?
    ORDER BY t.fecha_limite DESC
  `, [curso_id]);

      return res.status(200).json(rows);
    }

    // ---------- CREAR (profesor/admin del curso) ----------
    if (req.method === 'POST' && action === 'crear') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const curso_id = resolveCursoId(req); // 👈 acepta alias
      const { titulo, descripcion=null, fecha_limite=null, puntos=0 } = req.body || {};

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
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const { id, curso_id, titulo, descripcion, fecha_limite, puntos, estado } = req.body || {};
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
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      let { tarea_id, curso_id } = req.query;
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

    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en tareas API:', err);
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
