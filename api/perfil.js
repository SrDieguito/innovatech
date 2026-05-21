// api/perfil.js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const userId = req.cookies?.user_id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // Traemos también id y rol
    const [rows] = await pool.query(
      `SELECT 
         id,
         nombre, 
         email, 
         telefono, 
         procedencia, 
         perfil, 
         cedula_ruc_pasaporte, 
         ubicacion, 
         fase, 
         deck, 
         descripcion, 
         imagen_perfil, 
         banner, 
         campo_accion, 
         organizacion,
         rol
       FROM usuarios 
       WHERE id = ?`, 
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const u = rows[0];
    // Normalizamos por consistencia con el front
    const payload = {
      id: u.id,
      nombre: u.nombre || 'USUARIO',
      rol: (u.rol || 'usuario').toLowerCase(),

      // resto del perfil (se mantiene lo que ya devolvías)
      email: u.email ?? null,
      telefono: u.telefono ?? null,
      procedencia: u.procedencia ?? null,
      perfil: u.perfil ?? null,
      cedula_ruc_pasaporte: u.cedula_ruc_pasaporte ?? null,
      ubicacion: u.ubicacion ?? null,
      fase: u.fase ?? null,
      deck: u.deck ?? null,
      descripcion: u.descripcion ?? null,
      imagen_perfil: u.imagen_perfil ?? null,
      banner: u.banner ?? null,
      campo_accion: u.campo_accion ?? null,
      organizacion: u.organizacion ?? null
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
