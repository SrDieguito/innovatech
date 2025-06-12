// /pages/api/cursos.js
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
});

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // CREAR CURSO
    if (req.method === "POST" && action === "crear") {
      const { nombre, descripcion, profesor_id, estudiantes } = req.body;
      if (!nombre || !profesor_id) return res.status(400).json({ error: "Faltan datos" });

      const [result] = await pool.query(
        "INSERT INTO cursos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)",
        [nombre, descripcion, profesor_id]
      );
      const cursoId = result.insertId;

      if (Array.isArray(estudiantes)) {
        for (const est of estudiantes) {
          let [rows] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [est.email]);
          let estudianteId;
          if (rows.length > 0) {
            estudianteId = rows[0].id;
          } else {
            const [insert] = await pool.query(
              "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, 'usuario')",
              [est.nombre, est.email]
            );
            estudianteId = insert.insertId;
          }
          await pool.query(
            "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
            [cursoId, estudianteId]
          );
        }
      }

      return res.status(201).json({ id: cursoId });
    }

    // OBTENER CURSOS
    if (req.method === "GET" && action === "obtener") {
      const [cursos] = await pool.query(`
        SELECT c.id, c.nombre, c.descripcion, u.nombre AS profesor
        FROM cursos c
        JOIN usuarios u ON c.profesor_id = u.id
      `);
      return res.status(200).json(cursos);
    }

    // OBTENER PROFESORES
    if (req.method === "GET" && action === "profesores") {
      const [profesores] = await pool.query(
        "SELECT id, nombre FROM usuarios WHERE rol = 'profesor'"
      );
      return res.status(200).json(profesores);
    }

    // OBTENER ESTUDIANTES DE UN CURSO
    if (req.method === "GET" && action === "estudiantes") {
      const { curso_id } = req.query;
      if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });

      const [estudiantes] = await pool.query(`
        SELECT u.id, u.nombre, u.email
        FROM cursos_estudiantes ce
        JOIN usuarios u ON ce.estudiante_id = u.id
        WHERE ce.curso_id = ?
      `, [curso_id]);
      return res.status(200).json(estudiantes);
    }

    // DESMATRICULAR ESTUDIANTE
    if (req.method === "DELETE" && action === "desmatricular") {
      const { curso_id, estudiante_id } = req.query;
      if (!curso_id || !estudiante_id) return res.status(400).json({ error: "Faltan parámetros" });

      await pool.query(
        "DELETE FROM cursos_estudiantes WHERE curso_id = ? AND estudiante_id = ?",
        [curso_id, estudiante_id]
      );
      return res.status(200).json({ message: "Estudiante desmatriculado" });
    }

    res.status(400).json({ error: "Acción inválida o método no soportado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}