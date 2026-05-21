import mysql from "mysql2/promise";

export default async function handler(req, res) {
  console.log("Método recibido:", req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Conexión a la DB
  let db;
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Actualizar a entregadas si hay archivo y estado pendiente
    await db.query(`
      UPDATE tareas_entregas te
      JOIN tareas t ON te.tarea_id = t.id
      SET te.estado = 'entregada'
      WHERE te.estado = 'pendiente'
        AND te.archivo_nombre IS NOT NULL
    `);

    await db.end();

    res.status(200).json({ success: true, message: 'Estados actualizados a entregadas' });

  } catch (err) {
    console.error(err);
    if (db) await db.end();
    res.status(500).json({ success: false, error: err.message });
  }
}
