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

    // ELIMINAR CURSO
if (req.method === "DELETE" && action === "eliminar") {
  const { curso_id } = req.query;
  if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });

  try {
    // Elimina estudiantes relacionados al curso primero (si aplica)
    await pool.query("DELETE FROM cursos_estudiantes WHERE curso_id = ?", [curso_id]);

    // Elimina el curso
    const [result] = await pool.query("DELETE FROM cursos WHERE id = ?", [curso_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    return res.status(200).json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    return res.status(500).json({ error: "Error al eliminar curso" });
  }
}

if (action === 'actualizar-descripcion') {
  const { curso_id, descripcion } = req.body;
  const usuarioId = req.session.usuario?.id;

  if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

  // Verificar que sea el profesor
  const curso = await db.get("SELECT * FROM cursos WHERE id = ?", [curso_id]);
  if (!curso || curso.profesor_id !== usuarioId) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  await db.run("UPDATE cursos SET descripcion = ? WHERE id = ?", [descripcion, curso_id]);
  return res.json({ success: true });
}

    // EDITAR CURSO
    if (req.method === "PUT" && action === "editar") {
      const { curso_id, nombre, descripcion, profesor_id } = req.body;
      if (!curso_id || !nombre || !profesor_id) {
        return res.status(400).json({ error: "Faltan datos para editar el curso" });
      }

      await pool.query(
        "UPDATE cursos SET nombre = ?, descripcion = ?, profesor_id = ? WHERE id = ?",
        [nombre, descripcion, profesor_id, curso_id]
      );

      return res.status(200).json({ message: "Curso actualizado correctamente" });
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

    // OBTENER USUARIOS NO MATRICULADOS
    if (req.method === "GET" && action === "no-matriculados") {
      const { curso_id } = req.query;
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

    // MATRICULAR ESTUDIANTE MANUALMENTE
    if (req.method === "POST" && action === "matricular-manual") {
      const { curso_id, estudiante_id } = req.body;
      if (!curso_id || !estudiante_id) return res.status(400).json({ error: "Faltan parámetros" });

      await pool.query(
        "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
        [curso_id, estudiante_id]
      );
      return res.status(200).json({ message: "Estudiante matriculado" });
    }

    // Obtener detalle del curso
if (req.method === "GET" && action === "obtener-detalle") {
  const { curso_id } = req.query;
  if (!curso_id) return res.status(400).json({ error: "Falta curso_id" });

  const [rows] = await pool.query(`
    SELECT c.id, c.nombre, c.descripcion, u.nombre AS profesor
    FROM cursos c
    LEFT JOIN usuarios u ON c.profesor_id = u.id
    WHERE c.id = ?
  `, [curso_id]);

  if (rows.length === 0) return res.status(404).json({ error: "Curso no encontrado" });
  return res.status(200).json(rows[0]);
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
