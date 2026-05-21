import { pool } from './db.js';

async function authMiddleware(req) {
  if (!req.cookies || !req.cookies.user_id) {
    return { error: 'No autorizado', status: 401 };
  }
  return { userId: req.cookies.user_id };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const auth = await authMiddleware(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ success: false, error: auth.error });
    }

    const [rows] = await pool.query(`
      SELECT DISTINCT c.id, c.nombre, c.descripcion, u.nombre AS profesor, 'estudiante' AS rol
      FROM cursos c
      INNER JOIN cursos_estudiantes ce ON ce.curso_id = c.id
      LEFT JOIN usuarios u ON c.profesor_id = u.id
      WHERE ce.estudiante_id = ?

      UNION

      SELECT DISTINCT c.id, c.nombre, c.descripcion, u.nombre AS profesor, 'profesor' AS rol
      FROM cursos c
      INNER JOIN usuarios u ON c.profesor_id = u.id
      WHERE c.profesor_id = ?
      ORDER BY nombre ASC
    `, [auth.userId, auth.userId]);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
