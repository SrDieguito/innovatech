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
  if (req.method === 'GET') {
    console.log("Cookies recibidas:", req.cookies); // 🐛 Depuración

    const userId = req.cookies.user_id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    try {
      const [rows] = await pool.query(
        `SELECT nombre, email, telefono, procedencia, perfil, cedula_ruc_pasaporte, 
         ubicacion, fase, deck, descripcion, imagen_perfil, banner, campo_accion, organizacion 
         FROM usuarios WHERE id = ?`, 
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      console.log("Perfil obtenido:", rows[0]); // 🐛 Depuración
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
