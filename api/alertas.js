import { pool } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const userId = req.cookies?.user_id;
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  try {
    const [cursos] = await pool.query(
      `SELECT c.id, c.nombre FROM cursos c
       INNER JOIN cursos_estudiantes ce ON ce.curso_id = c.id
       WHERE ce.estudiante_id = ?`,
      [userId]
    );

    if (!cursos.length) return res.json({ alertas: [] });

    const alertas = [];

    for (const curso of cursos) {
      const [rows] = await pool.query(
        `SELECT
           COUNT(DISTINCT t.id) AS total_tareas,
           COUNT(DISTINCT CASE WHEN e.calificacion IS NOT NULL THEN t.id END) AS tareas_calificadas,
           AVG(e.calificacion::float) AS promedio
         FROM tareas t
         LEFT JOIN (
           SELECT DISTINCT ON (tarea_id) tarea_id, calificacion
           FROM tareas_entregas
           WHERE estudiante_id = ?
           ORDER BY tarea_id, fecha_entrega DESC
         ) e ON e.tarea_id = t.id
         WHERE t.curso_id = ?`,
        [userId, curso.id]
      );

      const row = rows[0];
      const calificadas = parseInt(row?.tareas_calificadas || 0);
      if (calificadas < 1) continue;

      const promedio = parseFloat(Number(row.promedio || 0).toFixed(1));
      let nivel = null;
      if (promedio < 5) nivel = 'peligro';
      else if (promedio < 7) nivel = 'alerta';

      if (nivel) {
        alertas.push({
          curso_id: curso.id,
          curso_nombre: curso.nombre,
          promedio,
          nivel,
          total_tareas: parseInt(row.total_tareas || 0),
          tareas_calificadas: calificadas,
        });
      }
    }

    return res.json({ alertas });
  } catch (err) {
    console.error('Error /api/alertas:', err);
    return res.status(500).json({ error: 'Error al cargar alertas' });
  }
}
