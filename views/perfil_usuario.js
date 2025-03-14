import express from "express";
import mysql from "mysql2/promise";
import session from "express-session";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
  })
);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pasantia',
});

db.connect(err => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Middleware para verificar sesión
const requireAuth = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  next();
};

// Obtener datos del perfil
app.get('/api/perfil', requireAuth, (req, res) => {
  const userId = req.session.user_id;
  const query = 'SELECT nombre, email, telefono, procedencia, perfil, ubicacion, fase, deck, descripcion, imagen_perfil, banner, campo_accion, organizacion FROM usuarios WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(results[0]);
  });
});

// Actualizar descripción
app.post('/api/perfil/descripcion', requireAuth, (req, res) => {
  const userId = req.session.user_id;
  const { descripcion } = req.body;
  const query = 'UPDATE usuarios SET descripcion = ? WHERE id = ?';
  db.query(query, [descripcion, userId], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Descripción actualizada' });
  });
});

// Configurar subida de imágenes
const storage = multer.diskStorage({
  destination: './public/imagenes/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Subir imagen de perfil
app.post('/api/perfil/imagen', requireAuth, upload.single('profile_image'), (req, res) => {
  const userId = req.session.user_id;
  const imagePath = '/imagenes/' + req.file.filename;
  const query = 'UPDATE usuarios SET imagen_perfil = ? WHERE id = ?';
  db.query(query, [imagePath, userId], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Imagen de perfil actualizada', imagePath });
  });
});

// Actualizar contraseña
app.post('/api/perfil/password', requireAuth, async (req, res) => {
  const userId = req.session.user_id;
  const { old_password, new_password } = req.body;

  db.query('SELECT password FROM usuarios WHERE id = ?', [userId], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    
    const validPassword = await bcrypt.compare(old_password, results[0].password);
    if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });
    
    const hashedPassword = await bcrypt.hash(new_password, 10);
    db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, userId], err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Contraseña actualizada' });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
