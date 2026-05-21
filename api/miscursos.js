import mysql from "mysql2/promise";

// Crear el pool (puedes mover esto a un archivo separado si prefieres reutilizarlo)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
});

async function authMiddleware(req) {
  if (!req.cookies || !req.cookies.user_id) {
    return { error: 'No autorizado', status: 401 };
  }
  return { userId: req.cookies.user_id };
}

export default async function handler(req, res) {
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');

  // Handle non-GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Método no permitido',
      message: 'Solo se permiten solicitudes GET en este endpoint'
    });
  }

  try {
    // Authenticate user
    const auth = await authMiddleware(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.error,
        message: 'Por favor inicie sesión para continuar'
      });
    }

    // Query the database
    const [rows] = await pool.query(`
      SELECT DISTINCT 
        c.id, 
        c.nombre, 
        c.descripcion, 
        u.nombre AS profesor, 
        'estudiante' AS rol
      FROM cursos c
      INNER JOIN cursos_estudiantes ce ON ce.curso_id = c.id
      LEFT JOIN usuarios u ON c.profesor_id = u.id
      WHERE ce.estudiante_id = ?

      UNION

      SELECT DISTINCT 
        c.id, 
        c.nombre, 
        c.descripcion, 
        u.nombre AS profesor, 
        'profesor' AS rol
      FROM cursos c
      INNER JOIN usuarios u ON c.profesor_id = u.id
      WHERE c.profesor_id = ?
      ORDER BY nombre ASC
    `, [auth.userId, auth.userId]);

    // Add active status based on dates
    const cursosConEstado = rows.map(curso => ({
      ...curso,
      activo: new Date(curso.fecha_fin) >= new Date()
    }));

    return res.status(200).json({
      success: true,
      data: cursosConEstado
    });

  } catch (error) {
    console.error('Error al obtener cursos:', error);
    // Get more detailed error information
    const errorInfo = {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql
    };
    
    console.error('Error details:', errorInfo);
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al procesar su solicitud'
    });
  }
}
