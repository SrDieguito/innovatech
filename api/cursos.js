import { pool } from "../../db.js"; // Ajusta la ruta a tu archivo de conexión

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { nombre, descripcion, profesorId, estudiantes } = req.body;

  if (!nombre || !profesorId || !Array.isArray(estudiantes) || estudiantes.length === 0) {
    return res.status(400).json({ error: "Faltan datos requeridos o estudiantes inválidos." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Crear el curso
    const [cursoRes] = await conn.execute(
      "INSERT INTO cursos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)",
      [nombre, descripcion || "", profesorId]
    );
    const cursoId = cursoRes.insertId;

    // 2. Insertar estudiantes (usuarios con rol estudiante)
    for (const estudiante of estudiantes) {
      const { nombre, correo } = estudiante;
      if (!nombre || !correo) continue;

      // Verificar si ya existe
      const [existe] = await conn.execute(
        "SELECT id FROM usuarios WHERE correo = ?",
        [correo]
      );

      let estudianteId;
      if (existe.length > 0) {
        estudianteId = existe[0].id;
      } else {
        const [nuevo] = await conn.execute(
          "INSERT INTO usuarios (nombre, correo, rol) VALUES (?, ?, 'estudiante')",
          [nombre, correo]
        );
        estudianteId = nuevo.insertId;
      }

      // Asociar al curso
      await conn.execute(
        "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
        [cursoId, estudianteId]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Curso creado correctamente", cursoId });
  } catch (error) {
    await conn.rollback();
    console.error("Error creando curso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    conn.release();
  }
}
