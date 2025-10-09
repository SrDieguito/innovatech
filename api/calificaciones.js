// api/calificaciones.js
import mysql from 'mysql2/promise';


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


/* Helpers: cookies -> userId / userRole */
function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce((acc, kv) => {
    const [k, v] = kv.split("=").map(s => (s || "").trim());
    if (k) acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}
function getUserId(req)   { return parseInt(parseCookies(req)?.user_id, 10) || null; }
function getUserRole(req) { return parseCookies(req)?.user_role || null; }

/* Respuesta JSON corta */
const send = (res, code, payload) => res.status(code).json(payload);

/* Handler */
export default async function handler(req, res) {
  try {
    // Solo GET
    if (req.method !== "GET") return send(res, 405, { error: "Método no permitido" });

    const { action, curso_id: cursoIdStr } = req.query || {};
    if (!action || action !== "listar_por_curso") {
      return send(res, 400, { error: "Acción inválida" });
    }

    const curso_id = Number(cursoIdStr);
    if (!curso_id) return send(res, 400, { error: "curso_id requerido" });

    const userId  = getUserId(req);
    const roleRaw = getUserRole(req);              // 'admin' | 'usuario' | 'profesor'
    if (!userId || !roleRaw) return send(res, 401, { error: "No autenticado" });

    // Normalizamos roles: 'usuario' == estudiante
    const isAdmin     = roleRaw === "admin";
    const isProfesor  = roleRaw === "profesor";
    const isEstudiante= roleRaw === "usuario";

    // Verificar inscripción del estudiante si es estudiante
    if (isEstudiante) {
      const [ins] = await pool.query(
        "SELECT 1 FROM cursos_estudiantes WHERE curso_id=? AND estudiante_id=? LIMIT 1",
        [curso_id, userId]
      );
      if (ins.length === 0) {
        return send(res, 403, { error: "No autorizado (no inscrito en el curso)" });
      }
    }

    // MODO PROFESOR/ADMIN: ver todas las tareas del curso y todos los estudiantes (desplegable)
    if (isAdmin || isProfesor) {
      const [rows] = await pool.query(`
        SELECT
          t.id            AS tarea_id,
          t.titulo        AS tarea_titulo,
          t.fecha_limite  AS tarea_fecha_limite,
          u.id            AS estudiante_id,
          u.nombre        AS estudiante_nombre,
          te.id           AS entrega_id,
          te.calificacion AS calificacion,
          te.observacion  AS observacion,
          te.fecha_entrega
        FROM tareas t
        LEFT JOIN cursos c                ON c.id = t.curso_id
        LEFT JOIN cursos_estudiantes ce   ON ce.curso_id = c.id
        LEFT JOIN usuarios u              ON u.id = ce.estudiante_id
        LEFT JOIN tareas_entregas te
               ON te.tarea_id = t.id AND te.estudiante_id = u.id
        WHERE t.curso_id = ?
        ORDER BY (t.fecha_limite IS NULL), t.fecha_limite DESC, t.id DESC, u.nombre ASC
      `, [curso_id]);

      // Agrupamos en JS -> una tarea con su lista de estudiantes/entregas
      const tareasMap = new Map();
      for (const r of rows) {
        if (!tareasMap.has(r.tarea_id)) {
          tareasMap.set(r.tarea_id, {
            id: r.tarea_id,
            titulo: r.tarea_titulo,
            fecha_limite: r.tarea_fecha_limite,
            estudiantes: []
          });
        }
        if (r.estudiante_id) {
          tareasMap.get(r.tarea_id).estudiantes.push({
            id: r.estudiante_id,
            nombre: r.estudiante_nombre,
            entrega_id: r.entrega_id,
            calificacion: r.calificacion,
            observacion: r.observacion,
            fecha_entrega: r.fecha_entrega
          });
        }
      }

      const tareas = Array.from(tareasMap.values());
      return send(res, 200, { ok: true, modo: "profesor", curso_id, tareas });
    }

    // MODO ESTUDIANTE: ver todas las tareas del curso con SU nota/observación/estado
    if (isEstudiante) {
      const [rows] = await pool.query(`
        SELECT
          t.id            AS tarea_id,
          t.titulo        AS tarea_titulo,
          t.fecha_limite  AS tarea_fecha_limite,
          te.id           AS entrega_id,
          te.calificacion AS calificacion,
          te.observacion  AS observacion,
          te.fecha_entrega,
          CASE
            WHEN te.id IS NOT NULL THEN 'entregada'
            WHEN NOW() > t.fecha_limite THEN 'vencida'
            ELSE 'pendiente'
          END AS estado
        FROM tareas t
        INNER JOIN cursos c               ON c.id = t.curso_id
        INNER JOIN cursos_estudiantes ce  ON ce.curso_id = c.id AND ce.estudiante_id = ?
        LEFT JOIN tareas_entregas te      ON te.tarea_id = t.id AND te.estudiante_id = ?
        WHERE c.id = ?
        ORDER BY (t.fecha_limite IS NULL), t.fecha_limite DESC, t.id DESC
      `, [userId, userId, curso_id]);

      // Para el front unificamos la forma: cada tarea tendrá estudiantes[1] = el propio alumno
      const tareas = rows.map(r => ({
        id: r.tarea_id,
        titulo: r.tarea_titulo,
        fecha_limite: r.fecha_limite,
        estado: r.estado,
        estudiantes: [{
          id: userId,
          nombre: null, // no necesario para el propio
          entrega_id: r.entrega_id,
          calificacion: r.calificacion,
          observacion: r.observacion,
          fecha_entrega: r.fecha_entrega
        }]
      }));
      return send(res, 200, { ok: true, modo: "estudiante", curso_id, tareas });
    }

    // Otros roles (si apareciera alguno)
    return send(res, 403, { error: "Rol no autorizado" });

  } catch (err) {
    console.error("[/api/calificaciones] error", {
      code: err?.code, errno: err?.errno, sql: err?.sql, msg: err?.sqlMessage || err?.message
    });
    return send(res, 500, {
      error: "Error interno del servidor",
      details: { code: err?.code, errno: err?.errno, message: err?.sqlMessage || err?.message }
    });
  }
}
