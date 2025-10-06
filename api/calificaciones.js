// api/calificaciones.js
import { pool } from "./db.js";
import { authMiddleware } from "./middleware.js";

// Helper functions
function getUserId(req) {
  return req.cookies?.user_id;
}

function getUserRole(req) {
  return req.cookies?.user_role;
}

async function isOwnerOrAdmin(userId, cursoId) {
  if (!userId || !cursoId) return false;
  
  const [[user]] = await pool.query(
    "SELECT rol FROM usuarios WHERE id = ?",
    [userId]
  );
  
  if (!user) return false;
  if (user.rol === 'admin') return true;
  
  const [[curso]] = await pool.query(
    "SELECT 1 FROM cursos WHERE id = ? AND profesor_id = ?",
    [cursoId, userId]
  );
  
  return !!curso;
}

const json = (res, code, payload) => res.status(code).json(payload);

export default async function handler(req, res) {
  try {
    const { action } = req.query || {};
    if (req.method !== "GET") {
      return json(res, 405, { error: "Método no permitido" });
    }
    if (action !== "listar_por_curso") {
      return json(res, 400, { error: "Acción inválida" });
    }

    const curso_id = parseInt(req.query.curso_id, 10);
    if (!curso_id) return json(res, 400, { error: "curso_id requerido" });

    const userId = getUserId(req);
    const role = getUserRole(req) || "estudiante";
    if (!userId) return json(res, 401, { error: "No autenticado" });

    // Permisos: profesor dueño/admin ve todo; estudiante solo sus notas si está inscrito
    let puedeVerTodo = false;
    if (await isOwnerOrAdmin(userId, curso_id)) puedeVerTodo = true;

    // Verificar inscripción del estudiante si no es owner/admin
    if (!puedeVerTodo && role === "estudiante") {
      const [insc] = await pool.query(
        "SELECT 1 FROM cursos_estudiantes WHERE curso_id=? AND usuario_id=? LIMIT 1",
        [curso_id, userId]
      );
      if (insc.length === 0) return json(res, 403, { error: "No autorizado" });
    }

    // Consulta para obtener tareas del curso y sus entregas
    const [rows] = await pool.query(
      `
      SELECT
        t.id           AS tarea_id,
        t.titulo       AS tarea_titulo,
        t.fecha_limite AS tarea_fecha_limite,
        u.id           AS estudiante_id,
        COALESCE(NULLIF(TRIM(u.nombre), ''), u.email) AS estudiante_nombre,
        te.id          AS entrega_id,
        te.calificacion,
        te.observacion AS observaciones,
        te.fecha_entrega
      FROM tareas t
      INNER JOIN cursos c ON c.id = t.curso_id
      INNER JOIN cursos_estudiantes ce ON ce.curso_id = c.id
      INNER JOIN usuarios u ON u.id = ce.usuario_id
      LEFT JOIN tareas_entregas te
        ON te.tarea_id = t.id AND te.estudiante_id = u.id
      WHERE t.curso_id = ?
      ORDER BY t.fecha_limite DESC, u.id ASC
      `,
      [curso_id]
    );
    
    console.log('Datos obtenidos de la base de datos:', rows);
    

    // Si es estudiante y no tiene privilegios, filtramos a su propio id
    const filtered = (!puedeVerTodo && role === "estudiante")
      ? rows.filter(r => r.estudiante_id === userId)
      : rows;

    // Armar estructura por tarea
    const tareasMap = new Map();
    for (const r of filtered) {
      if (!tareasMap.has(r.tarea_id)) {
        tareasMap.set(r.tarea_id, {
          id: r.tarea_id,
          titulo: r.tarea_titulo,
          fecha_limite: r.tarea_fecha_limite,
          estudiantes: []
        });
      }
      tareasMap.get(r.tarea_id).estudiantes.push({
        id: r.estudiante_id,
        nombre: r.estudiante_nombre,
        entrega_id: r.entrega_id,
        calificacion: r.calificacion,
        observaciones: r.observaciones,
        fecha_entrega: r.fecha_entrega
      });
    }

    // Métricas rápidas por tarea
    const tareas = Array.from(tareasMap.values()).map(t => {
      const notas = t.estudiantes.map(e => (e.calificacion ?? null)).filter(v => v !== null);
      const promedio = notas.length ? (notas.reduce((a,b)=>a+Number(b),0)/notas.length) : null;
      const evaluadas = notas.length;
      const total = t.estudiantes.length;
      const sin_entrega_o_sin_nota = total - evaluadas;
      return { ...t, promedio, evaluadas, total, pendientes: sin_entrega_o_sin_nota };
    });

    return json(res, 200, { curso_id, puedeVerTodo, tareas });
  } catch (err) {
    console.error("GET /api/calificaciones error:", err);
    if (err?.code === "ER_NO_SUCH_TABLE") {
      return json(res, 500, { error: "Tabla faltante", details: err.code });
    }
    return json(res, 500, { error: "Error interno del servidor" });
  }
}
