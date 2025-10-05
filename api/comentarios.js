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

    // Obtener observaciones de la tarea
    const [tarea] = await pool.query(
      `SELECT 
          observacion as texto,
          fecha_creacion,
          'Profesor' as usuario,
          'profesor' as rol
       FROM tareas_entrega
       WHERE id = ? AND observacion IS NOT NULL
       LIMIT 1`,
      [tareaIdFinal]
    );

    // Si no hay tarea con observación, devolver array vacío
    if (tarea.length === 0) {
      return res.status(200).json([]);
    }

    // Formatear la respuesta para que coincida con la estructura esperada
    const comentarioFormateado = {
      texto: tarea[0].texto,
      fecha: tarea[0].fecha_creacion,
      usuario: tarea[0].usuario,
      rol: tarea[0].rol
    };

    return res.status(200).json([comentarioFormateado]);

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
