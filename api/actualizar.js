import { pool } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // PostgreSQL no soporta UPDATE...JOIN, se usa FROM en su lugar
    await pool.query(`
      UPDATE tareas_entregas
      SET estado = 'entregada'
      FROM tareas
      WHERE tareas_entregas.tarea_id = tareas.id
        AND tareas_entregas.estado = 'pendiente'
        AND tareas_entregas.archivo_nombre IS NOT NULL
    `);

    return res.status(200).json({ success: true, message: 'Estados actualizados a entregadas' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
