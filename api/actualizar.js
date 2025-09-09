// Actualizar estados de tareas_entregas según fecha y entrega
app.post('/api/actualizar', async (req, res) => {
  try {
    // Actualizar a vencidas si fecha límite pasó y sigue pendiente
    await db.query(`
      UPDATE tareas_entregas te
      JOIN tareas t ON te.tarea_id = t.id
      SET te.estado = 'vencida'
      WHERE te.estado = 'pendiente'
        AND NOW() > t.fecha_limite
    `);

    res.json({ success: true, message: 'Estados actualizados' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
