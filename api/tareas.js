import mysql from "mysql2/promise";

// Normalizador de fechas
function toMySQLDateTime(input) {
  if (!input) return null;

  // formato HTML datetime-local: 2025-12-25T17:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) {
    const [d, t] = input.split('T');
    return `${d} ${t}:00`;
  }

  // formato DD/MM/YYYY HH:mm
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, hh, mi] = m;
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:00`;
  }

  // formato YYYY-MM-DD HH:mm
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(input)) {
    return `${input}:00`;
  }

  // último intento: si viene ISO (2025-12-25T17:00:00Z)
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const pad = n => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const mo = pad(d.getMonth() + 1);
    const da = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    return `${y}-${mo}-${da} ${h}:${mi}:${s}`;
  }

  return null;
}

// Crear el pool de conexiones a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
});
function readCookieFromHeader(req, name) {
  const raw = req.headers?.cookie || '';
  const parts = raw.split(/; */);
  for (const p of parts) {
    if (!p) continue;
    const idx = p.indexOf('=');
    if (idx < 0) continue;
    const k = decodeURIComponent(p.slice(0, idx).trim());
    const v = decodeURIComponent(p.slice(idx + 1).trim());
    if (k === name) return v;
  }
  return '';
}

/* ===== Helpers ===== */
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


// NUEVO: normaliza el filtro de estado
function normEstado(e) {
  const v = (e || 'todos').toString().toLowerCase().trim();
  return ['pendiente', 'completada', 'vencida', 'todos'].includes(v) ? v : 'todos';
}
/* ===== Handler ===== */
export default async function handler(req, res) {
  const method = String(req.method || '').toUpperCase();
  const action = String((req.query?.action || req.body?.action || '')).trim().toLowerCase();
  // Permite testear desde URL: ?_method=DELETE
  const override = String(req.query?._method || '').toUpperCase();
  const effMethod = override ? override : method;

  try {
    // ---------- LISTAR ----------
    if (effMethod === 'GET' && action === 'listar') {
      const curso_id = resolveCursoId(req, { allowBody: false });
      if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });

      const estado = normEstado(req.query.estado);
      const q = (req.query.q || '').toString().trim();

      // Intentamos identificar usuario para el cálculo de estado por entrega
      const me = await getUserId(req); // {id, rol} | null
      const params = [];
      let sqlBase = `
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
          c.profesor_id`;

      if (me && me.rol === 'estudiante') {
        sqlBase += `,
          CASE
            WHEN te.id IS NOT NULL THEN 'completada'
            WHEN t.fecha_limite < NOW() THEN 'vencida'
            ELSE 'pendiente'
          END AS estado_calculado
        `;
      } else {
        sqlBase += `,
          CASE
            WHEN t.fecha_limite < NOW() THEN 'vencida'
            ELSE 'pendiente'
          END AS estado_calculado
        `;
      }
      let sql = `${sqlBase}
        FROM tareas t
        LEFT JOIN cursos c ON t.curso_id = c.id
        LEFT JOIN usuarios u ON c.profesor_id = u.id
        ${me && me.rol === 'estudiante' ? 'LEFT JOIN tareas_entregas te ON te.tarea_id = t.id AND te.estudiante_id = ?' : ''}
        WHERE t.curso_id = ?
      `;
      if (me && me.rol === 'estudiante') params.push(me.id);
      params.push(curso_id);

      if (q) { sql += ` AND (t.titulo LIKE ? OR t.descripcion LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
      if (estado !== 'todos') { sql += ` HAVING estado_calculado = ?`; params.push(estado); }
      sql += ` ORDER BY t.fecha_limite DESC`;

      const [rows] = await pool.query(sql, params);
      return res.status(200).json(rows);
    }
    // ---------- DETALLE ----------

    if (req.method === 'GET' && action === 'detalle') {
      const tareaId = Number(req.query.id || req.query.tareaId);
      const estado = normEstado(req.query.estado);
      const q = (req.query.q || '').toString().trim();

      // Estudiante: calcular estado por su entrega y fecha
      if (me && me.rol === 'estudiante') {
        const params = [me.id, curso_id];
        let sql = `
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
            c.profesor_id,
            CASE
              WHEN te.id IS NOT NULL THEN 'completada'
              WHEN t.fecha_limite < NOW() THEN 'vencida'
              ELSE 'pendiente'
            END AS estado_calculado
          FROM tareas t
          LEFT JOIN cursos c ON t.curso_id = c.id
          LEFT JOIN usuarios u ON c.profesor_id = u.id
          LEFT JOIN tareas_entregas te
            ON te.tarea_id = t.id AND te.estudiante_id = ?
          WHERE t.curso_id = ?
          `;
        if (q) { sql += ` AND (t.titulo LIKE ? OR t.descripcion LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
        if (estado !== 'todos') { sql += ` HAVING estado_calculado = ?`; params.push(estado); }
        sql += ` ORDER BY t.fecha_limite DESC`;
        const [rows] = await pool.query(sql, params);
        return res.status(200).json(rows);
      }

      // Profesor (o sin sesión): estado por fecha (útil para filtrar vencidas/pendientes)
      {
        const params = [curso_id];
        let sql = `
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
            c.profesor_id,
            CASE
              WHEN t.fecha_limite < NOW() THEN 'vencida'
              ELSE 'pendiente'
            END AS estado_calculado
          FROM tareas t
          LEFT JOIN cursos c ON t.curso_id = c.id
          LEFT JOIN usuarios u ON c.profesor_id = u.id
          WHERE t.curso_id = ?
        `;
        if (q) { sql += ` AND (t.titulo LIKE ? OR t.descripcion LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
        if (estado !== 'todos') { sql += ` HAVING estado_calculado = ?`; params.push(estado); }
        sql += ` ORDER BY t.fecha_limite DESC`;
        const [rows] = await pool.query(sql, params);
        return res.status(200).json(rows);
      }
    }

// ---------- DETALLE (nuevo endpoint) ----------
if (req.method === 'GET' && action === 'detalle') {
  const tarea_id = req.query.id || req.query.tarea_id;
  if (!tarea_id) return res.status(400).json({ error: 'tarea_id requerido' });

  const user = await getUserId(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });

  // Consulta actualizada para incluir la calificación y observación del estudiante desde tareas_entregas
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
      c.profesor_id,
      c.nombre AS curso_nombre,
      te.calificacion,  -- Calificación del estudiante
      te.observacion    -- Observación (comentario) del profesor
    FROM tareas t
    LEFT JOIN cursos c ON t.curso_id = c.id
    LEFT JOIN usuarios u ON c.profesor_id = u.id
    LEFT JOIN tareas_entregas te ON t.id = te.tarea_id AND te.estudiante_id = ?
    WHERE t.id = ?
  `, [user.id, tarea_id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }
  return res.status(200).json(rows[0]);
}

    // ---------- CREAR (profesor/admin del curso) ----------
    if (req.method === 'POST' && action === 'crear') {
      const user = await getUserId(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      let { titulo, descripcion, fecha_limite, puntos, curso_id } = req.body || {};
      curso_id = Number(curso_id || req.query?.curso_id);
      
      if (!curso_id) return res.status(400).json({ error: 'Falta curso_id' });
      if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'Falta título' });

      // Normalizar y validar la fecha
      const fechaSQL = toMySQLDateTime(fecha_limite);
      if (fecha_limite && !fechaSQL) {
        return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD HH:mm o DD/MM/YYYY HH:mm' });
      }

      // Verificar permisos
      if (!await isProfesor(user.id, curso_id)) {
        return res.status(403).json({ error: 'Solo el profesor puede crear tareas' });
      }

      // Validar puntos
      const pts = Number(puntos);
      const puntosNum = Number.isFinite(pts) ? pts : 0;

      try {
        const [result] = await pool.query(
          'INSERT INTO tareas (curso_id, titulo, descripcion, fecha_limite, puntos) VALUES (?, ?, ?, ?, ?)',
          [curso_id, titulo.trim(), descripcion || null, fechaSQL, puntosNum]
        );
        return res.status(201).json({ 
          success: true, 
          id: result.insertId, 
          message: 'Tarea creada correctamente' 
        });
      } catch (err) {
        console.error('Error al crear tarea:', err);
        throw err; // Será manejado por el catch global
      }
    }

    // ---------- EDITAR (profesor/admin del curso) ----------
    if (req.method === 'PUT' && action === 'editar') {
      const user = await getUserId(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      const { id, curso_id, titulo, descripcion, fecha_limite, puntos, estado } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id requerido' });

      const cursoIdReal = curso_id ?? (await getCursoIdByTarea(id));
      if (!cursoIdReal) return res.status(404).json({ error: 'Tarea no encontrada' });
      if (!await isProfesor(user.id, cursoIdReal)) {
        return res.status(403).json({ error: 'Solo el profesor puede editar tareas' });
      }

      const cols = await getColumns('tareas');
      const setParts = []; const params = [];

      if (cols.has('titulo')      && titulo      !== undefined) { setParts.push('titulo=?');       params.push(String(titulo).trim()); }
      if (cols.has('descripcion') && descripcion !== undefined) { setParts.push('descripcion=?');  params.push(descripcion); }
      if (cols.has('fecha_limite') && fecha_limite !== undefined) { 
        setParts.push('fecha_limite=?'); 
        params.push(fecha_limite ? toMySQLDateTime(fecha_limite) : null); 
      }

      params.push(id);
      await pool.query(`UPDATE tareas SET ${setParts.join(', ')} WHERE id = ?`, params);
      return res.status(200).json({ ok: true });
    }

    // ---------- ELIMINAR (profesor/admin del curso) ----------
    if (req.method === 'DELETE' && action === 'eliminar') {
      try {
        // Acepta tarea_id desde query o body, con alias
        const q = req.query || {};
        const b = (req.body && typeof req.body === 'object') ? req.body : {};
        const tareaId = Number(q.tarea_id || q.id || b.tarea_id || b.id);

        if (!tareaId || Number.isNaN(tareaId) || tareaId <= 0) {
          return res.status(400).json({ 
            error: 'Parámetro inválido',
            details: 'Se requiere un ID de tarea válido (tarea_id o id)',
            received: { query: q, body: b }
          });
        }

        const user = await getUserId(req);
        if (!user) return res.status(401).json({ 
          error: 'No autenticado',
          code: 'AUTH_REQUIRED'
        });

        // Obtener el curso al que pertenece la tarea
        const cursoId = await getCursoIdByTarea(tareaId);
        if (!cursoId) {
          return res.status(404).json({ 
            error: 'Tarea no encontrada',
            code: 'TASK_NOT_FOUND'
          });
        }

        // Verificar permisos (solo profesor del curso o admin)
        if (!await isProfesor(user.id, cursoId)) {
          return res.status(403).json({ 
            error: 'No autorizado',
            details: 'Solo el profesor del curso puede eliminar tareas',
            code: 'FORBIDDEN'
          });
        }

        // Iniciar transacción para asegurar la integridad de los datos
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();

          // 1. Eliminar dependencias conocidas
          // Verificar si las tablas existen antes de intentar borrar
          const [tables] = await conn.query('SHOW TABLES');
          const tableNames = tables.map(t => Object.values(t)[0]);
          
          if (tableNames.includes('tareas_entregas')) {
            await conn.query('DELETE FROM tareas_entregas WHERE tarea_id = ?', [tareaId]);
          }
          
          if (tableNames.includes('comentarios')) {
            await conn.query('DELETE FROM comentarios WHERE tarea_id = ?', [tareaId]);
          }
          
          if (tableNames.includes('recomendaciones')) {
            await conn.query('DELETE FROM recomendaciones WHERE tarea_id = ?', [tareaId]);
          }

          // 2. Eliminar la tarea
          const [result] = await conn.query('DELETE FROM tareas WHERE id = ? LIMIT 1', [tareaId]);
          
          if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ 
              error: 'Tarea no encontrada',
              code: 'TASK_NOT_FOUND'
            });
          }

          await conn.commit();
          return res.json({ 
            success: true, 
            id: tareaId,
            message: 'Tarea eliminada correctamente'
          });

        } catch (err) {
          await conn.rollback();
          
          // Manejo específico de errores de restricción de clave foránea
          if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
              error: 'No se puede eliminar la tarea',
              details: 'Existen registros relacionados que impiden la eliminación',
              code: 'FOREIGN_KEY_CONSTRAINT',
              sqlMessage: err.sqlMessage
            });
          }
          
          console.error('Error en transacción al eliminar tarea:', err);
          throw err; // Será manejado por el catch global
          
        } finally {
          conn.release();
        }

      } catch (err) {
        // Si el error no fue manejado específicamente, lo relanzamos
        if (!err.handled) {
          console.error('Error no controlado al eliminar tarea:', err);
          throw err; // Será manejado por el catch global
        }
      }
    }

    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
    } catch (err) {
      console.error('Error en tareas API:', err);
      
      // Manejo de errores específicos de MySQL
      if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'No se puede eliminar: hay entregas/comentarios asociados.' });
      }
      if (err?.code === 'ER_TRUNCATED_WRONG_VALUE' || err?.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
        return res.status(400).json({ error: 'Valor inválido (revisa la fecha y los campos numéricos)' });
      }
      if (err?.code === 'ER_NO_DEFAULT_FOR_FIELD' || err?.code === 'ER_BAD_NULL_ERROR') {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }
      if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(404).json({ error: 'Recurso relacionado no encontrado' });
      }
      
      // Para modo desarrollo, incluir más detalles del error
      const errorResponse = process.env.NODE_ENV === 'development' 
        ? { 
            error: 'Error interno del servidor',
            message: err.message,
            code: err.code,
            stack: err.stack
          }
        : { error: 'Error interno del servidor' };
      
      return res.status(500).json(errorResponse);
    }
}