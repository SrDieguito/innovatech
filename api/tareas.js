import { pool } from './db.js';

function toDateTimeString(input) {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return input.replace('T', ' ') + ':00';
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}:00`;
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(input)) return `${input}:00`;
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.toISOString().replace('T', ' ').slice(0, 19);
  return null;
}

function readCookieFromHeader(req, name) {
  const raw = req.headers?.cookie || '';
  for (const p of raw.split(/; */)) {
    if (!p) continue;
    const idx = p.indexOf('=');
    if (idx < 0) continue;
    const k = decodeURIComponent(p.slice(0, idx).trim());
    const v = decodeURIComponent(p.slice(idx + 1).trim());
    if (k === name) return v;
  }
  return '';
}

async function getUserId(req) {
  const cookieId = req.cookies?.user_id || readCookieFromHeader(req, 'user_id') || '';
  const id = Number(cookieId || req.headers['x-user-id'] || 0);
  if (!Number.isFinite(id) || id <= 0) return null;
  let rol = (req.cookies?.user_role || readCookieFromHeader(req, 'user_role') || req.headers['x-user-role'] || '').toString().toLowerCase();
  if (!rol) {
    const [[u]] = await pool.query('SELECT id, rol FROM usuarios WHERE id=?', [id]);
    if (!u) return null;
    rol = (u.rol || '').toLowerCase();
  }
  return { id, rol };
}

function resolveCursoId(req, { allowBody = true } = {}) {
  const q = req.query || {};
  const b = allowBody ? (req.body || {}) : {};
  const raw = q.curso_id ?? q.course_id ?? q.id ?? q.cid ?? b.curso_id ?? b.course_id ?? b.id ?? b.cid ?? null;
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
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = ?`,
    [table]
  );
  const set = new Set(rows.map(r => r.column_name));
  return { has: (c) => set.has(c), set };
}

function normEstado(e) {
  const v = (e || 'todos').toString().toLowerCase().trim();
  return ['pendiente', 'completada', 'vencida', 'todos'].includes(v) ? v : 'todos';
}

function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try { return JSON.parse(body); } catch { return {}; }
}

export default async function handler(req, res) {
  const method = String(req.method || '').toUpperCase();
  const action = String((req.query?.action || req.body?.action || '')).trim().toLowerCase();
  const override = String(req.query?._method || '').toUpperCase();
  const effMethod = override || method;

  try {
    // ---------- LISTAR ----------
    if (effMethod === 'GET' && action === 'listar') {
      const curso_id = resolveCursoId(req, { allowBody: false });
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });

      const estado = normEstado(req.query.estado);
      const q = (req.query.q || '').toString().trim();
      const me = await getUserId(req);
      const params = [];

      let sqlBase = `
        SELECT t.id, t.curso_id,
          COALESCE(t.titulo,'(Sin título)') AS title,
          COALESCE(t.descripcion,'') AS description,
          t.fecha_limite AS due_at,
          COALESCE(t.puntos,0) AS points,
          t.completada AS status,
          t.fecha_creacion AS created_at,
          t.fecha_completacion AS updated_at,
          u.nombre AS profesor, c.profesor_id,`;

      const esEstudiante = me && (me.rol === 'estudiante' || me.rol === 'usuario');

      if (esEstudiante) {
        sqlBase += `
          CASE WHEN te.id IS NOT NULL THEN 'completada'
               WHEN t.fecha_limite < NOW() THEN 'vencida' ELSE 'pendiente' END AS estado_calculado`;
      } else {
        sqlBase += `
          CASE WHEN t.fecha_limite < NOW() THEN 'vencida' ELSE 'pendiente' END AS estado_calculado`;
      }

      let sql = `${sqlBase}
        FROM tareas t
        LEFT JOIN cursos c ON t.curso_id = c.id
        LEFT JOIN usuarios u ON c.profesor_id = u.id
        ${esEstudiante ? 'LEFT JOIN tareas_entregas te ON te.tarea_id = t.id AND te.estudiante_id = ?' : ''}
        WHERE t.curso_id = ?`;

      if (esEstudiante) params.push(me.id);
      params.push(curso_id);
      if (q) { sql += ` AND (t.titulo ILIKE ? OR t.descripcion ILIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
      sql += ` ORDER BY t.fecha_limite DESC`;

      // En PostgreSQL no se puede usar HAVING con alias de SELECT; se envuelve en subquery
      if (estado !== 'todos') {
        sql = `SELECT * FROM (${sql}) _sub WHERE _sub.estado_calculado = ?`;
        params.push(estado);
      }

      const [rows] = await pool.query(sql, params);
      return res.status(200).json(rows);
    }

    // ---------- DETALLE ----------
    if (req.method === 'GET' && action === 'detalle') {
      const tarea_id = req.query.id || req.query.tarea_id;
      if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

      const user = await getUserId(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      const [rows] = await pool.query(`
        SELECT t.id, t.curso_id,
          COALESCE(t.titulo,'(Sin título)') AS title,
          COALESCE(t.descripcion,'') AS description,
          t.fecha_limite AS due_at,
          COALESCE(t.puntos,0) AS points,
          t.completada AS status,
          t.fecha_creacion AS created_at,
          t.fecha_completacion AS updated_at,
          u.nombre AS profesor, c.profesor_id, c.nombre AS curso_nombre,
          te.calificacion, te.observacion
        FROM tareas t
        LEFT JOIN cursos c ON t.curso_id = c.id
        LEFT JOIN usuarios u ON c.profesor_id = u.id
        LEFT JOIN tareas_entregas te ON t.id = te.tarea_id AND te.estudiante_id = ?
        WHERE t.id = ?`,
        [user.id, tarea_id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
      return res.status(200).json(rows[0]);
    }

    // ---------- CREAR ----------
    if (req.method === 'POST' && action === 'crear') {
      const user = await getUserId(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      let { titulo, descripcion, fecha_limite, puntos, curso_id } = req.body || {};
      curso_id = Number(curso_id || req.query?.curso_id);
      if (!curso_id) return res.status(400).json({ error: 'Falta curso_id' });
      if (!titulo?.trim()) return res.status(400).json({ error: 'Falta título' });

      const fechaSQL = toDateTimeString(fecha_limite);
      if (fecha_limite && !fechaSQL) return res.status(400).json({ error: 'Formato de fecha inválido' });
      if (!await isProfesor(user.id, curso_id)) return res.status(403).json({ error: 'Solo el profesor puede crear tareas' });

      const puntosNum = Number.isFinite(Number(puntos)) ? Number(puntos) : 0;
      const [rows] = await pool.query(
        'INSERT INTO tareas (curso_id, titulo, descripcion, fecha_limite, puntos) VALUES (?, ?, ?, ?, ?) RETURNING id',
        [curso_id, titulo.trim(), descripcion || null, fechaSQL, puntosNum]
      );
      return res.status(201).json({ success: true, id: rows[0]?.id, message: 'Tarea creada correctamente' });
    }

    // ---------- EDITAR ----------
    if (req.method === 'PUT' && action === 'editar') {
      const user = await getUserId(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      const { id, curso_id, titulo, descripcion, fecha_limite } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id requerido' });

      const cursoIdReal = curso_id ?? (await getCursoIdByTarea(id));
      if (!cursoIdReal) return res.status(404).json({ error: 'Tarea no encontrada' });
      if (!await isProfesor(user.id, cursoIdReal)) return res.status(403).json({ error: 'Solo el profesor puede editar tareas' });

      const cols = await getColumns('tareas');
      const setParts = []; const params = [];

      if (cols.has('titulo') && titulo !== undefined)           { setParts.push('titulo=?');       params.push(String(titulo).trim()); }
      if (cols.has('descripcion') && descripcion !== undefined) { setParts.push('descripcion=?');  params.push(descripcion); }
      if (cols.has('fecha_limite') && fecha_limite !== undefined) {
        setParts.push('fecha_limite=?');
        params.push(fecha_limite ? toDateTimeString(fecha_limite) : null);
      }
      if (!setParts.length) return res.status(400).json({ error: 'Nada para actualizar' });
      params.push(id);
      await pool.query(`UPDATE tareas SET ${setParts.join(', ')} WHERE id = ?`, params);
      return res.status(200).json({ ok: true });
    }

    // ---------- ELIMINAR ----------
    if ((effMethod === 'DELETE' || (req.method === 'POST' && req.headers['x-http-method-override']?.toUpperCase() === 'DELETE')) && action === 'eliminar') {
      const q = req.query || {};
      const b = parseJsonBody(req.body) || {};
      const tareaId = Number(q.tarea_id || q.id || b.tarea_id || b.id || b.tareaId);

      if (!tareaId || isNaN(tareaId) || tareaId <= 0) {
        return res.status(400).json({ error: 'Se requiere un ID de tarea válido' });
      }

      const user = await getUserId(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      const cursoId = await getCursoIdByTarea(tareaId);
      if (!cursoId) return res.status(404).json({ error: 'Tarea no encontrada' });

      if (!await isProfesor(user.id, cursoId)) {
        return res.status(403).json({ error: 'Solo el profesor del curso puede eliminar tareas' });
      }

      let conn;
      try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Verificar tablas relacionadas en PostgreSQL
        const [tables] = await conn.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()`
        );
        const tableNames = tables.map(t => t.table_name);

        const relatedTables = [
          { name: 'tareas_entregas', column: 'tarea_id' },
          { name: 'comentarios', column: 'tarea_id' },
          { name: 'recomendaciones', column: 'tarea_id' },
        ];

        for (const { name, column } of relatedTables) {
          if (tableNames.includes(name)) {
            await conn.query(`DELETE FROM ${name} WHERE ${column} = ?`, [tareaId]);
          }
        }

        const [result] = await conn.query('DELETE FROM tareas WHERE id = ?', [tareaId]);
        if (result.affectedRows === 0) {
          await conn.rollback();
          return res.status(404).json({ error: 'Tarea no encontrada en la base de datos' });
        }

        await conn.commit();
        return res.status(200).json({ success: true, id: tareaId, message: 'Tarea eliminada correctamente' });
      } catch (err) {
        if (conn) await conn.rollback();
        // Error de clave foránea en PostgreSQL: código 23503
        if (err.code === '23503') {
          return res.status(409).json({ error: 'No se puede eliminar: hay entregas/comentarios asociados.' });
        }
        throw err;
      } finally {
        if (conn) conn.release();
      }
    }

    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en tareas API:', err);
    // Códigos de error PostgreSQL
    if (err?.code === '23503') return res.status(409).json({ error: 'No se puede eliminar: hay entregas/comentarios asociados.' });
    if (err?.code === '23502') return res.status(400).json({ error: 'Faltan campos obligatorios' });
    if (err?.code === '23505') return res.status(409).json({ error: 'Registro duplicado' });
    return res.status(500).json({
      error: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' ? { message: err.message, code: err.code } : {}),
    });
  }
}
