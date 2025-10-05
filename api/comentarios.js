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

    // Obtener observaciones como comentarios de la tabla tareas
    const [comentarios] = await pool.query(
      `SELECT 
          t.observacion as texto,
          t.fecha_creacion,
          u.nombre as usuario,
          u.rol as usuario_rol
       FROM tareas t
       JOIN usuarios u ON t.profesor_id = u.id
       WHERE t.id = ? AND t.observacion IS NOT NULL
       ORDER BY t.fecha_creacion DESC`,
      [tareaIdFinal]
    );

    // Formatear la respuesta para que coincida con la estructura esperada
    const comentariosFormateados = comentarios.map(comentario => ({
      texto: comentario.texto,
      fecha: comentario.fecha_creacion,
      usuario: comentario.usuario,
      rol: comentario.usuario_rol
    }));

    return res.status(200).json(comentariosFormateados);

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
