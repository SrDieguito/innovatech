// Subir entrega y actualizar estado a 'entregada'
app.post('/api/entregas', async (req, res) => {
  try {
    const { tarea_id, curso_id } = req.body;
    const archivo = req.file; // si usas multer para subir archivos

    if (!tarea_id || !archivo) {
      return res.status(400).json({ success: false, error: "Falta tarea o archivo" });
    }

    // Guardar info del archivo en la DB
    await db.query(`
      INSERT INTO tareas_entregas (tarea_id, usuario_id, archivo_nombre, archivo_url, estado, fecha_entrega)
      VALUES (?, ?, ?, ?, 'entregada', NOW())
      ON DUPLICATE KEY UPDATE
        archivo_nombre = VALUES(archivo_nombre),
        archivo_url = VALUES(archivo_url),
        estado = 'entregada',
        fecha_entrega = NOW()
    `, [tarea_id, req.user.id, archivo.originalname, `/uploads/${archivo.filename}`]);

    res.json({ success: true, message: "Archivo subido y estado actualizado a entregada" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Actualizar entregas vencidas según fecha límite (puede ser cron o llamado manual)
app.post('/api/entregas/actualizar-vencidas', async (req, res) => {
  try {
    await db.query(`
      UPDATE tareas_entregas te
      JOIN tareas t ON te.tarea_id = t.id
      SET te.estado = 'vencida'
      WHERE te.estado = 'pendiente'
        AND NOW() > t.fecha_limite
    `);

    res.json({ success: true, message: 'Estados vencidos actualizados' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
