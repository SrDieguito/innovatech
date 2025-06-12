import mysql from "mysql2/promise";

// Crear el pool (puedes mover esto a un archivo separado si prefieres reutilizarlo)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Tu middleware local
  async function authMiddleware(req, res) {
    if (!req.cookies || !req.cookies.user_id) {
      res.status(401).json({ error: "No autorizado" });
      return null;
    }
    return req.cookies.user_id;
  }

  const estudianteId = await authMiddleware(req, res);
  if (!estudianteId) return; // Ya devolvió 401 si no está logueado

  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.nombre, c.descripcion
      FROM cursos c
      INNER JOIN cursos_estudiantes ce ON ce.curso_id = c.id
      WHERE ce.estudiante_id = ?
    `, [estudianteId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener cursos del estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
