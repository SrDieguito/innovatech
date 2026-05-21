import { pool } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const userId = req.cookies?.user_id;
    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    const cursoId = req.query?.id;
    if (!cursoId) return res.status(400).json({ message: 'Falta id de curso' });

    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.imagen_perfil
       FROM usuarios u
       INNER JOIN cursos_estudiantes ce ON u.id = ce.estudiante_id
       WHERE ce.curso_id = ?
       ORDER BY u.nombre ASC`,
      [cursoId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
