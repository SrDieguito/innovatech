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
    const { method, url, query } = req;
    const urlParts = url.split("/").filter(Boolean);

    console.log("urlParts:", urlParts);

    // Extraer cursoId y estudianteId
    let cursoId = null;
    let estudianteId = null;

    if (urlParts[0] === "api" && urlParts[1] === "cursos") {
      if (urlParts.length >= 3) cursoId = urlParts[2];
      if (urlParts.length >= 5 && urlParts[3] === "estudiantes") estudianteId = urlParts[4];
    }

    // Si no hay en ruta, buscar en query
    if (!cursoId && query.cursoId) cursoId = query.cursoId;
    if (!estudianteId && query.estudianteId) estudianteId = query.estudianteId;

    // Obtener valor de estudiantes (booleano) desde query
    const estudiantesQuery = query.estudiantes;

    // ======== RUTAS PRINCIPALES ========

    // GET /api/cursos (listar todos)
    if (method === "GET" && urlParts.length === 2) {
      const [cursos] = await conn.execute(`
        SELECT c.id, c.nombre, c.descripcion, u.nombre AS tutor
        FROM cursos c
        JOIN usuarios u ON c.profesor_id = u.id
      `);
      return res.status(200).json(cursos);
    }

    // POST /api/cursos (crear nuevo)
    if (method === "POST" && urlParts.length === 2) {
      const { nombre, descripcion, profesor_id, estudiantes } = req.body;

      if (!nombre || !profesor_id || !Array.isArray(estudiantes) || estudiantes.length === 0) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      await conn.beginTransaction();

      try {
        const [cursoRes] = await conn.execute(
          "INSERT INTO cursos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)",
          [nombre, descripcion || "", profesor_id]
        );
        const nuevoCursoId = cursoRes.insertId;

        for (const estudiante of estudiantes) {
          const { nombre, email } = estudiante;
          if (!nombre || !email) continue;

          const [existe] = await conn.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
          let estId = existe.length ? existe[0].id : (await conn.execute(
            "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, 'usuario')",
            [nombre, email]
          ))[0].insertId;

          await conn.execute(
            "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
            [nuevoCursoId, estId]
          );
        }

        await conn.commit();
        return res.status(201).json({ message: "Curso creado", cursoId: nuevoCursoId });
      } catch (error) {
        await conn.rollback();
        throw error;
      }
    }

    // ======== RUTAS ESPECÍFICAS DE CURSO ========

    // GET /api/cursos/:id (detalles de curso)
    if (method === "GET" && urlParts.length === 3) {
      const [curso] = await conn.execute(`
        SELECT c.id, c.nombre, c.descripcion, u.id AS profesor_id, u.nombre AS profesorNombre
        FROM cursos c
        JOIN usuarios u ON c.profesor_id = u.id
        WHERE c.id = ?
      `, [cursoId]);

      if (curso.length === 0) {
        return res.status(404).json({ error: "Curso no encontrado" });
      }

      return res.status(200).json(curso[0]);
    }

    // PUT /api/cursos/:id (actualizar curso)
    if (method === "PUT" && urlParts.length === 3) {
      const { nombre, descripcion, profesor_id } = req.body;

      await conn.execute(
        "UPDATE cursos SET nombre = ?, descripcion = ?, profesor_id = ? WHERE id = ?",
        [nombre, descripcion || "", profesor_id, cursoId]
      );

      return res.status(200).json({ message: "Curso actualizado" });
    }

    // ======== RUTAS DE ESTUDIANTES ========

    // GET /api/cursos/:id/estudiantes (listar estudiantes)
    if (method === "GET" && urlParts.length === 4 && urlParts[3] === "estudiantes") {
      const [estudiantes] = await conn.execute(`
        SELECT u.id, u.nombre, u.email
        FROM cursos_estudiantes ce
        JOIN usuarios u ON ce.estudiante_id = u.id
        WHERE ce.curso_id = ?
      `, [cursoId]);

      return res.status(200).json(estudiantes);
    }

    // POST /api/cursos/:id/estudiantes (matricular estudiante)
    if (method === "POST" && urlParts.length === 4 && urlParts[3] === "estudiantes") {
      const { nombre, email } = req.body;

      if (!nombre || !email) {
        return res.status(400).json({ error: "Nombre y email requeridos" });
      }

      let [existe] = await conn.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
      let estId = existe.length ? existe[0].id : (await conn.execute(
        "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, 'usuario')",
        [nombre, email]
      ))[0].insertId;

      await conn.execute(
        "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
        [cursoId, estId]
      );

      return res.status(200).json({ message: "Estudiante matriculado" });
    }

    // DELETE /api/cursos/:id/estudiantes/:estudianteId (desmatricular)
    if (method === "DELETE" && urlParts.length === 5 && urlParts[3] === "estudiantes") {
      // Verificar si existe la matrícula
      const [matricula] = await conn.execute(
        'SELECT * FROM cursos_estudiantes WHERE curso_id = ? AND estudiante_id = ?', 
        [cursoId, estudianteId]
      );

      if (matricula.length === 0) {
        return res.status(404).json({ error: "Estudiante no matriculado" });
      }

      // Eliminar
      await conn.execute(
        'DELETE FROM cursos_estudiantes WHERE curso_id = ? AND estudiante_id = ?',
        [cursoId, estudianteId]
      );

      return res.status(200).json({ success: true, message: "Estudiante desmatriculado" });
    }

    // ======== RUTAS ALTERNATIVAS CON QUERY PARAMS ========

    // GET /api/cursos?cursoId=X&estudiantes=true (alternativa)
    if (method === "GET" && cursoId && estudiantesQuery === "true") {
      const [estudiantes] = await conn.execute(`
        SELECT u.id, u.nombre, u.email
        FROM cursos_estudiantes ce
        JOIN usuarios u ON ce.estudiante_id = u.id
        WHERE ce.curso_id = ?
      `, [cursoId]);
      return res.status(200).json(estudiantes);
    }

    // POST /api/cursos?cursoId=X (matricular múltiples - alternativa)
    if (method === "POST" && cursoId && !estudianteId) {
      const { estudiantes } = req.body;
      if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
        return res.status(400).json({ error: "Lista de estudiantes inválida" });
      }

      for (const est of estudiantes) {
        const { nombre, email } = est;
        if (!nombre || !email) continue;

        let [existe] = await conn.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
        let estId = existe.length ? existe[0].id : (await conn.execute(
          "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, 'usuario')",
          [nombre, email]
        ))[0].insertId;

        await conn.execute(
          "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES (?, ?)",
          [cursoId, estId]
        );
      }

      return res.status(200).json({ message: "Estudiantes matriculados" });
    }

    // DELETE /api/cursos?cursoId=X&estudianteId=Y (alternativa)
    if (method === "DELETE" && cursoId && estudianteId) {
      await conn.execute(
        "DELETE FROM cursos_estudiantes WHERE curso_id = ? AND estudiante_id = ?",
        [cursoId, estudianteId]
      );
      return res.status(200).json({ message: "Estudiante desmatriculado" });
    }

    return res.status(405).json({ error: "Método no permitido" });

  } catch (error) {
    console.error("Error en API:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    conn.release();
  }
}