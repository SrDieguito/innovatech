// Tu importación actual
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
  const conn = await pool.getConnection();

  try {
    const { method, url } = req;
    const urlParts = url.split("/").filter(Boolean); // divide por '/', remueve vacíos

    // Ruta: GET /api/cursos
    if (method === "GET" && urlParts.length === 2) {
      const [cursos] = await conn.execute(`
        SELECT c.id, c.nombre, c.descripcion, u.nombre AS tutor
        FROM cursos c
        JOIN usuarios u ON c.profesor_id = u.id
      `);
      return res.status(200).json(cursos);
    }

    // Ruta: POST /api/cursos
    if (method === "POST" && urlParts.length === 2) {
      const { nombre, descripcion, profesorId, estudiantes } = req.body;

      if (!nombre || !profesorId || !Array.isArray(estudiantes) || estudiantes.length === 0) {
        return res.status(400).json({ error: "Faltan datos requeridos o estudiantes inválidos." });
      }

      await conn.beginTransaction();

      const [cursoRes] = await conn.execute(
        "INSERT INTO cursos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)",
        [nombre, descripcion || "", profesorId]
      );
      const cursoId = cursoRes.insertId;

      for (const estudiante of estudiantes) {
        const { nombre, email } = estudiante;
        if (!nombre || !email) continue;

        const [existe] = await conn.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
        let estudianteId = existe.length ? existe[0].id : (await conn.execute(
          "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, 'usuario')",
          [nombre, email]
        ))[0].insertId;

        await conn.execute(
          "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
          [cursoId, estudianteId]
        );
      }

      await conn.commit();
      return res.status(201).json({ message: "Curso creado correctamente", cursoId });
    }

    // Ruta: PUT /api/cursos/:id
    if (method === "PUT" && urlParts.length === 3) {
      const cursoId = urlParts[2];
      const { nombre, descripcion, profesorId } = req.body;

      await conn.execute(
        "UPDATE cursos SET nombre = ?, descripcion = ?, profesor_id = ? WHERE id = ?",
        [nombre, descripcion || "", profesorId, cursoId]
      );

      return res.status(200).json({ message: "Curso actualizado correctamente" });
    }

    // Ruta: GET /api/cursos/:id/estudiantes
    if (method === "GET" && urlParts.length === 4 && urlParts[3] === "estudiantes") {
      const cursoId = urlParts[2];
      const [estudiantes] = await conn.execute(`
        SELECT u.id, u.nombre, u.email
        FROM cursos_estudiantes ce
        JOIN usuarios u ON ce.estudiante_id = u.id
        WHERE ce.curso_id = ?
      `, [cursoId]);

      return res.status(200).json(estudiantes);
    }

    // Ruta: POST /api/cursos/:id/estudiantes
    if (method === "POST" && urlParts.length === 4 && urlParts[3] === "estudiantes") {
      const cursoId = urlParts[2];
      const { nombre, email } = req.body;

      if (!nombre || !email) {
        return res.status(400).json({ error: "Nombre y email requeridos" });
      }

      let [existe] = await conn.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
      let estudianteId = existe.length ? existe[0].id : (await conn.execute(
        "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, 'usuario')",
        [nombre, email]
      ))[0].insertId;

      await conn.execute(
        "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
        [cursoId, estudianteId]
      );

      return res.status(200).json({ message: "Estudiante matriculado" });
    }

    // Ruta: DELETE /api/cursos/:id/estudiantes/:estudianteId
    if (method === "DELETE" && urlParts.length === 5 && urlParts[3] === "estudiantes") {
      const cursoId = urlParts[2];
      const estudianteId = urlParts[4];

      await conn.execute(
        "DELETE FROM cursos_estudiantes WHERE curso_id = ? AND estudiante_id = ?",
        [cursoId, estudianteId]
      );

      return res.status(200).json({ message: "Estudiante desmatriculado" });
    }

    return res.status(405).json({ error: "Ruta o método no permitido" });
  } catch (error) {
    if (req.method === "POST") await conn.rollback();
    console.error("Error en /api/cursos:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    conn.release();
  }
}
