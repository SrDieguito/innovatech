// File: /api/usuarios.js
import mysql from "mysql2/promise";
import { authMiddleware } from "../../utils/authMiddleware.js"; // Asegúrate de que la ruta esté bien

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
});

export default async function handler(req, res) {
  const { method } = req;

  if (method === "GET") {
    const { rol, action } = req.query;

    // 🔹 MIS CURSOS (como profesor o estudiante)
    if (action === "mis-cursos") {
      const userId = await authMiddleware(req, res);
      if (!userId) return;

      try {
        const [cursos] = await pool.query(`
          SELECT DISTINCT c.id, c.nombre, c.descripcion, u.nombre AS profesor,
            CASE 
              WHEN c.profesor_id = ? THEN 'profesor'
              ELSE 'estudiante'
            END AS rol_usuario
          FROM cursos c
          JOIN usuarios u ON c.profesor_id = u.id
          LEFT JOIN cursos_estudiantes ce ON ce.curso_id = c.id AND ce.estudiante_id = ?
          WHERE c.profesor_id = ? OR ce.estudiante_id IS NOT NULL
        `, [userId, userId, userId]);

        return res.status(200).json(cursos);
      } catch (error) {
        console.error("Error al obtener cursos del usuario:", error);
        return res.status(500).json({ error: "Error interno al obtener cursos." });
      }
    }

    // 🔹 USUARIOS POR ROL
    if (rol) {
      try {
        console.log("Parámetro rol:", rol);

        const [rows] = await pool.query(
          "SELECT id, nombre FROM usuarios WHERE rol = ?",
          [rol]
        );

        console.log("Usuarios encontrados:", rows);

        return res.status(200).json(rows);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
      }
    }

    return res.status(400).json({ error: "Parámetro faltante: 'rol' o 'action' requerido." });
  }

  return res.status(405).json({ error: "Método no permitido." });
}
