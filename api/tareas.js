import { pool } from './db.js';

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // CREAR TAREA
    if (req.method === 'POST' && action === 'crear') {
      const { curso_id, titulo, descripcion, fecha_limite, puntos } = req.body;
      
      if (!curso_id || !titulo || !fecha_limite) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const [result] = await pool.query(
        'INSERT INTO tareas (curso_id, titulo, descripcion, fecha_limite, puntos, fecha_creacion) VALUES (?, ?, ?, ?, ?, NOW())',
        [curso_id, titulo, descripcion, new Date(fecha_limite), puntos || 0]
      );

      return res.status(201).json({ 
        id: result.insertId,
        message: 'Tarea creada exitosamente' 
      });
    }

    // OBTENER TAREAS DE UN CURSO
    if (req.method === 'GET' && action === 'listar') {
      const { curso_id } = req.query;
      
      if (!curso_id) {
        return res.status(400).json({ error: 'Se requiere el ID del curso' });
      }

      const [tareas] = await pool.query(
        'SELECT id, titulo, descripcion, puntos, DATE_FORMAT(fecha_limite, "%Y-%m-%d") as fecha_limite, fecha_creacion FROM tareas WHERE curso_id = ? ORDER BY fecha_limite ASC',
        [curso_id]
      );

      return res.status(200).json(tareas);
    }

    // ELIMINAR TAREA
    if (req.method === 'DELETE' && action === 'eliminar') {
      const { tarea_id } = req.query;
      
      if (!tarea_id) {
        return res.status(400).json({ error: 'Se requiere el ID de la tarea' });
      }

      await pool.query('DELETE FROM tareas WHERE id = ?', [tarea_id]);
      return res.status(200).json({ message: 'Tarea eliminada exitosamente' });
    }

    res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en tareas API:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: err.message 
    });
  }
}
