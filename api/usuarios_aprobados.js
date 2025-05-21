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
    try {
      const [rows] = await pool.query(
        `SELECT id, nombre, email, telefono, ubicacion, descripcion, imagen_perfil, organizacion 
         FROM usuarios WHERE estado = 'aprobado'`
      );

      res.status(200).json(rows);
    } catch (error) {
      console.error('Error al obtener usuarios aprobados:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
