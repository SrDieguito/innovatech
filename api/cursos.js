// api/cursos.js
import mysql from "mysql2/promise";

/* ========= POOL (mantengo tu forma original) ========= */
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 42185,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }, // Railway / Vercel
});

/* ========= Helpers comunes ========= */
function getUserId(req) {
  // ajusta si tu cookie tiene otro nombre
  return req.cookies?.user_id || null;
}

// --- NUEVO: normaliza la lectura del curso_id ---
function resolveCursoId(req, { allowBody = true } = {}) {
  const q = req.query || {};
  const b = allowBody ? (req.body || {}) : {};
  const raw =
    q.curso_id ?? q.course_id ?? q.id ?? q.cid ??
    b.curso_id ?? b.course_id ?? b.id ?? b.cid ?? null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// --- NUEVO: fallback SOLO para lecturas GET (si el usuario tiene 1 curso) ---
async function fallbackCourseIdForUser(userId) {
  if (!userId) return null;
  // único curso como estudiante
  const [enrs] = await pool.query(
    `SELECT ce.curso_id FROM cursos_estudiantes ce
     WHERE ce.estudiante_id=? LIMIT 2`, [userId]
  );
  if (enrs.length === 1) return enrs[0].curso_id;
  // único curso como profesor
  const [owns] = await pool.query(
    `SELECT c.id FROM cursos c
     WHERE c.profesor_id=? LIMIT 2`, [userId]
  );
  if (owns.length === 1) return owns[0].id;
  return null;
}

// ¿Profesor/Admin? Si llega cursoId además valida que sea dueño del curso
async function isProfesor(userId, cursoId) {
  const [[u]] = await pool.query("SELECT rol FROM usuarios WHERE id=?", [userId]);
  if (!u) return false;
  if (u.rol === "admin" || u.rol === "profesor") {
    if (!cursoId) return true;
    const [[c]] = await pool.query(
      "SELECT 1 FROM cursos WHERE id=? AND profesor_id=?",
      [cursoId, userId]
    );
    return !!c;
  }
  return false;
}

async function isOwnerOrAdmin(userId, cursoId) {
  const [[u]] = await pool.query("SELECT rol FROM usuarios WHERE id=?", [userId]);
  if (!u) return false;
  if (u.rol === "admin") return true;
  const [[c]] = await pool.query(
    "SELECT 1 FROM cursos WHERE id=? AND profesor_id=?",
    [cursoId, userId]
  );
  return !!c;
}

// Detección de columnas (para no romper si el esquema cambia)
async function getColumns(table) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  const set = new Set(rows.map((r) => r.COLUMN_NAME));
  return { has: (c) => set.has(c), set };
}

/* ========= Handler ========= */
export default async function handler(req, res) {
  const { action } = req.query;

  try {
    /* ====== CREAR CURSO (profesor/admin) ====== */
    if (req.method === "POST" && action === "crear") {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "No autenticado" });
      if (!await isProfesor(userId)) {
        return res.status(403).json({ error: "Solo profesor/admin puede crear cursos" });
      }

      const cols = await getColumns("cursos");
      const {
        nombre,
        descripcion = null,
        portada_url = null,
        visibilidad = "privado",
        estado = "activo",
      } = req.body || {};
      if (!nombre) return res.status(400).json({ error: "Faltan datos" });

      // INSERT dinámico según columnas reales
      const insertCols = ["nombre", "descripcion", "profesor_id"];
      const insertVals = ["?", "?", "?"];
      const params = [String(nombre).trim(), descripcion, userId];

      if (cols.has("portada_url")) { insertCols.push("portada_url"); insertVals.push("?"); params.push(portada_url); }
      if (cols.has("visibilidad")) { insertCols.push("visibilidad"); insertVals.push("?"); params.push(visibilidad); }
      if (cols.has("estado"))      { insertCols.push("estado");      insertVals.push("?"); params.push(estado); }
      if (cols.has("fecha_creacion")) { insertCols.push("fecha_creacion"); insertVals.push("NOW()"); }

      const sql = `INSERT INTO cursos (${insertCols.join(",")}) VALUES (${insertVals.join(",")})`;
      const [result] = await pool.query(sql, params);
      const cursoId = result.insertId;

      // Mantengo tu lógica de matricular estudiantes si viene la lista
      const { estudiantes } = req.body || {};
      if (Array.isArray(estudiantes)) {
        for (const est of estudiantes) {
          const [rows] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [est.email]);
          let estudianteId;
          if (rows.length) {
            estudianteId = rows[0].id;
          } else {
            const [ins] = await pool.query(
              "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, 'usuario')",
              [est.nombre, est.email]
            );
            estudianteId = ins.insertId;
          }
          await pool.query(
            "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
            [cursoId, estudianteId]
          );
        }
      }

      return res.status(201).json({ id: cursoId, message: "Curso creado" });
    }

    /* ====== ELIMINAR CURSO (dueño/admin) ====== */
    if (req.method === "DELETE" && action === "eliminar") {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "No autenticado" });

      const curso_id = resolveCursoId(req);
      if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });
      if (!await isOwnerOrAdmin(userId, curso_id)) {
        return res.status(403).json({ error: "No autorizado" });
      }

      await pool.query("DELETE FROM cursos_estudiantes WHERE curso_id = ?", [curso_id]);
      const [result] = await pool.query("DELETE FROM cursos WHERE id = ?", [curso_id]);

      if (result.affectedRows === 0) return res.status(404).json({ error: "Curso no encontrado" });
      return res.status(200).json({ message: "Curso eliminado correctamente" });
    }

    /* ====== ACTUALIZAR DESCRIPCIÓN (dueño/admin) ====== */
    if (req.method === "PUT" && action === "actualizar-descripcion") {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "No autenticado" });

      const curso_id = resolveCursoId(req);
      const { descripcion } = req.body || {};
      if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });
      if (!await isOwnerOrAdmin(userId, curso_id)) {
        return res.status(403).json({ error: "No autorizado" });
      }
      await pool.query("UPDATE cursos SET descripcion = ? WHERE id = ?", [descripcion ?? null, curso_id]);
      return res.json({ success: true });
    }

    /* ====== EDITAR CURSO (dueño/admin) ====== */
    if (req.method === "PUT" && action === "editar") {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "No autenticado" });

      const curso_id = resolveCursoId(req);
      const { nombre, descripcion, profesor_id, portada_url, visibilidad, estado } = req.body || {};
      if (!curso_id) return res.status(400).json({ error: "Faltan datos para editar el curso" });
      if (!await isOwnerOrAdmin(userId, curso_id)) {
        return res.status(403).json({ error: "No autorizado" });
      }

      const cols = await getColumns("cursos");
      const set = []; const params = [];

      if (nombre !== undefined)        { set.push("nombre=?");        params.push(String(nombre).trim()); }
      if (descripcion !== undefined)   { set.push("descripcion=?");   params.push(descripcion); }
      if (profesor_id !== undefined)   { set.push("profesor_id=?");   params.push(profesor_id); }
      if (cols.has("portada_url") && portada_url !== undefined) { set.push("portada_url=?"); params.push(portada_url); }
      if (cols.has("visibilidad") && visibilidad !== undefined) { set.push("visibilidad=?"); params.push(visibilidad); }
      if (cols.has("estado") && estado !== undefined)           { set.push("estado=?");      params.push(estado); }
      if (cols.has("fecha_actualizacion")) set.push("fecha_actualizacion=NOW()");

      if (!set.length) return res.status(400).json({ error: "Nada para actualizar" });

      params.push(curso_id);
      await pool.query(`UPDATE cursos SET ${set.join(", ")} WHERE id = ?`, params);
      return res.status(200).json({ message: "Curso actualizado correctamente" });
    }

    /* ====== OBTENER (mantengo tu acción original) ====== */
    if (req.method === "GET" && action === "obtener") {
      const [cursos] = await pool.query(`
        SELECT c.id, c.nombre, c.descripcion, u.nombre AS profesor
        FROM cursos c
        JOIN usuarios u ON c.profesor_id = u.id
      `);
      return res.status(200).json(cursos);
    }

    /* ====== Otras acciones que ya tenías (mantengo) ====== */
    if (req.method === "GET" && action === "profesores") {
      const [profesores] = await pool.query("SELECT id, nombre FROM usuarios WHERE rol = 'profesor'");
      return res.status(200).json(profesores);
    }

    if (req.method === "GET" && action === "estudiantes") {
      let curso_id = resolveCursoId(req, { allowBody: false });
      if (!curso_id) {
        const userId = getUserId(req);
        curso_id = await fallbackCourseIdForUser(userId);
      }
      if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });

      const [estudiantes] = await pool.query(`
        SELECT u.id, u.nombre, u.email
        FROM cursos_estudiantes ce
        JOIN usuarios u ON ce.estudiante_id = u.id
        WHERE ce.curso_id = ?
      `, [curso_id]);
      return res.status(200).json(estudiantes);
    }

    if (req.method === "GET" && action === "no-matriculados") {
      let curso_id = resolveCursoId(req, { allowBody: false });
      if (!curso_id) {
        const userId = getUserId(req);
        curso_id = await fallbackCourseIdForUser(userId);
      }
      if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });

      const [usuarios] = await pool.query(`
        SELECT u.id, u.nombre, u.email
        FROM usuarios u
        WHERE u.rol = 'usuario'
          AND u.id NOT IN (
            SELECT estudiante_id
            FROM cursos_estudiantes
            WHERE curso_id = ?
          )
      `, [curso_id]);
      return res.status(200).json(usuarios);
    }

    if (req.method === "POST" && action === "matricular-manual") {
      const curso_id = resolveCursoId(req);
      const { estudiante_id } = req.body || {};
      if (!curso_id || !estudiante_id) return res.status(400).json({ error: "Faltan parámetros" });
      await pool.query(
        "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
        [curso_id, estudiante_id]
      );
      return res.status(200).json({ message: "Estudiante matriculado" });
    }

    if (req.method === "GET" && action === "obtener-detalle") {
      let curso_id = resolveCursoId(req, { allowBody: false });
      if (!curso_id) {
        const userId = getUserId(req);
        curso_id = await fallbackCourseIdForUser(userId);
      }
      if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });

      const [rows] = await pool.query(`
        SELECT c.id, c.nombre, c.descripcion, u.nombre AS profesor
        FROM cursos c
        LEFT JOIN usuarios u ON c.profesor_id = u.id
        WHERE c.id = ?
      `, [curso_id]);
      if (!rows.length) return res.status(404).json({ error: "Curso no encontrado" });
      return res.status(200).json(rows[0]);
    }

    return res.status(400).json({ error: "Acción inválida o método no soportado" });
  } catch (err) {
    console.error("Error en cursos API:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: err.message });
  }
}
