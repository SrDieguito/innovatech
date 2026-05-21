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

import { parseCookies } from "../_utils.js";

const json = (res, code, payload) => res.status(code).json(payload);

// === Helpers directos ===
function getUserId(req) {
  try {
    const cookies = parseCookies(req);
    return cookies.user_id ? Number(cookies.user_id) : null;
  } catch {
    return null;
  }
}

function getUserRole(req) {
  try {
    const cookies = parseCookies(req);
    return cookies.user_role || "estudiante";
  } catch {
    return "estudiante";
  }
}

// Permisos: true si es el profesor dueño del curso o admin
async function isOwnerOrAdmin(userId, cursoId) {
  if (!userId || !cursoId) return false;
  try {
    const [rows] = await pool.query(
      "SELECT 1 FROM cursos WHERE id=? AND tutor_id=? LIMIT 1",
      [cursoId, userId]
    );
    if (rows.length > 0) return true;
    const [roles] = await pool.query(
      "SELECT rol FROM usuarios WHERE id=? LIMIT 1",
      [userId]
    );
    if (roles.length && roles[0].rol === "admin") return true;
    return false;
  } catch {
    return false;
  }
}

// === Handler principal ===
export default async function handler(req, res) {
  try {
    const { action } = req.query || {};
    if (req.method !== "GET")
      return json(res, 405, { error: "Método no permitido" });
    if (action !== "listar_por_curso")
      return json(res, 400, { error: "Acción inválida" });

    const curso_id = parseInt(req.query.curso_id, 10);
    if (!curso_id) return json(res, 400, { error: "curso_id requerido" });

    const userId = getUserId(req);
    const role = getUserRole(req);
    if (!userId) return json(res, 401, { error: "No autenticado" });

    // Verificar permisos
    let puedeVerTodo = false;
    if (await isOwnerOrAdmin(userId, curso_id)) puedeVerTodo = true;

    // Si es estudiante, validar inscripción
    if (!puedeVerTodo && role === "estudiante") {
      const [ins] = await pool.query(
        "SELECT 1 FROM cursos_estudiantes WHERE curso_id=? AND usuario_id=? LIMIT 1",
        [curso_id, userId]
      );
      if (ins.length === 0)
        return json(res, 403, { error: "No autorizado" });
    }

    // === Consulta SQL ===
    const [rows] = await pool.query(
      `
      SELECT
        t.id AS tarea_id,
        t.titulo AS tarea_titulo,
        t.fecha_limite AS tarea_fecha_limite,
        u.id AS estudiante_id,
        u.email AS estudiante_nombre,
        te.id AS entrega_id,
        te.calificacion AS calificacion,
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

    // === Armar estructura ===
    const tareasMap = new Map();
    for (const r of rows) {
      if (!puedeVerTodo && role === "estudiante" && r.estudiante_id !== userId)
        continue;
      if (!tareasMap.has(r.tarea_id)) {
        tareasMap.set(r.tarea_id, {
          id: r.tarea_id,
          titulo: r.tarea_titulo,
          fecha_limite: r.tarea_fecha_limite,
          estudiantes: [],
        });
      }
      tareasMap.get(r.tarea_id).estudiantes.push({
        id: r.estudiante_id,
        nombre: r.estudiante_nombre,
        entrega_id: r.entrega_id,
        calificacion: r.calificacion,
        observaciones: r.observaciones,
        fecha_entrega: r.fecha_entrega,
      });
    }

    const tareas = Array.from(tareasMap.values()).map((t) => {
      const notas = t.estudiantes
        .map((e) => e.calificacion ?? null)
        .filter((v) => v !== null);
      const promedio = notas.length
        ? notas.reduce((a, b) => a + Number(b), 0) / notas.length
        : null;
      return {
        ...t,
        promedio,
        evaluadas: notas.length,
        total: t.estudiantes.length,
        pendientes: t.estudiantes.length - notas.length,
      };
    });

    return json(res, 200, { curso_id, puedeVerTodo, tareas });
  } catch (err) {
    console.error("GET /api/calificaciones error:", err);
    return json(res, 500, {
      error: "INTERNAL_SERVER_ERROR",
      message: err?.message || "Error desconocido",
    });
  }
}
