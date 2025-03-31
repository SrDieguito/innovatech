import { Router } from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import bcrypt from 'bcrypt';

const router = Router();

// Configuración de conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10
});

// Middleware para autenticación
const authMiddleware = async (req, res, next) => {
  if (!req.cookies || !req.cookies.user_id) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  req.user_id = req.cookies.user_id; // 🔥 Asignamos user_id manualmente
  next();
};

// ✅ Obtener perfil del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT nombre, email, telefono, procedencia, perfil, 
      cedula_ruc_pasaporte, ubicacion, fase, deck, descripcion, 
      imagen_perfil, banner, campo_accion, organizacion 
      FROM usuarios WHERE id = ?`, 
      [req.user_id] // 🔥 Usamos req.user_id
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ✅ Actualizar descripción del usuario
router.put('/descripcion', authMiddleware, async (req, res) => {
  const { description } = req.body;
  try {
    await pool.query(
      `UPDATE usuarios SET descripcion = ? WHERE id = ?`,
      [description, req.user_id] // 🔥 Usamos req.user_id
    );
    res.json({ message: 'Descripción actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la descripción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ✅ Configuración para subir imágenes con multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Actualizar imagen de perfil
router.post('/imagen_perfil', authMiddleware, upload.single('profile_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ninguna imagen' });
    }

    const imageUrl = `/imagenes/${req.file.originalname}`; // Simulación de URL de imagen
    await pool.query(
      `UPDATE usuarios SET imagen_perfil = ? WHERE id = ?`,
      [imageUrl, req.user_id] // 🔥 Usamos req.user_id
    );

    res.json({ message: 'Imagen de perfil actualizada', imageUrl });
  } catch (error) {
    console.error('Error al subir imagen de perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ✅ Actualizar contraseña
router.put('/password', authMiddleware, async (req, res) => {
  const { old_password, new_password } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT password FROM usuarios WHERE id = ?`,
      [req.user_id] // 🔥 Usamos req.user_id
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const passwordMatch = await bcrypt.compare(old_password, rows[0].password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Contraseña antigua incorrecta' });
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await pool.query(
      `UPDATE usuarios SET password = ? WHERE id = ?`,
      [hashedNewPassword, req.user_id] // 🔥 Usamos req.user_id
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
