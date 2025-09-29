import mysql from 'mysql2/promise';
import { pool } from './entregas.js';

// Helper para obtener el ID de usuario desde la solicitud
function getUserId(req) {
  return req.cookies?.user_id || null;
}

// Obtener comentarios de una tarea
export default async function handler(req, res) {
  const { tareaId, tarea_id } = req.query;
  const tareaIdFinal = tareaId || tarea_id;
  
  try {
    // Validar que se proporcione un ID de tarea
    if (!tareaIdFinal) {
      return res.status(400).json({ 
        error: 'Se requiere el ID de la tarea',
        details: 'Use el parámetro tareaId o tarea_id'
      });
    }

    // Obtener comentarios de la base de datos
    const [comentarios] = await pool.query(
      `SELECT c.*, u.nombre as usuario_nombre, u.rol as usuario_rol
       FROM comentarios c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.tarea_id = ?
       ORDER BY c.fecha_creacion DESC`,
      [tareaIdFinal]
    );

    return res.status(200).json(comentarios);

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
