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
    if (req.method === "GET") {
      const [cursos] = await conn.execute(`
        SELECT c.id, c.nombre, c.descripcion, u.nombre AS tutor
        FROM cursos c
        JOIN usuarios u ON c.profesor_id = u.id
      `);
      return res.status(200).json(cursos);
    }

    if (req.method === "POST") {
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
        const { nombre, correo } = estudiante;
        if (!nombre || !correo) continue;

        const [existe] = await conn.execute(
          "SELECT id FROM usuarios WHERE correo = ?",
          [correo]
        );

        let estudianteId;
        if (existe.length > 0) {
          estudianteId = existe[0].id;
        } else {
          const [nuevo] = await conn.execute(
            "INSERT INTO usuarios (nombre, correo, rol) VALUES (?, ?, 'usuario')",
            [nombre, correo]
          );
          estudianteId = nuevo.insertId;
        }

        await conn.execute(
          "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
          [cursoId, estudianteId]
        );
      }

      await conn.commit();
      return res.status(201).json({ message: "Curso creado correctamente", cursoId });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    if (req.method === "POST") await conn.rollback();
    console.error("Error en /api/cursos:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    conn.release();
  }
}
