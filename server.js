import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import http from 'http';

import { initWebSocket } from './wsServer.js';
import { pool } from './api/db.js';
import cursosHandler from './api/cursos.js';
import tareasRouter from './api/tareas.js';
import entregasHandler from './api/entregas.js';
import perfilHandler from './api/perfil.js';
import verificarSesion from './api/verificarSesion.js';
import miscursosHandler from './api/miscursos.js';
import participantesHandler from './api/participantes.js';
import usuariosHandler from './api/usuarios.js';
import adminHandler from './api/admin.js';
import calificacionesHandler from './api/calificaciones.js';
import logoutHandler from './api/logout.js';
import procesarFormularioHandler from './api/procesarformulario.js';
import actualizarHandler from './api/actualizar.js';
import cambiarContraHandler from './api/cambiar_contra.js';
import materialesHandler from './api/materiales.js';
import alertasHandler from './api/alertas.js';
import recomendacionesHandler from './api/recomendaciones/index.js';
import articuloHandler from './api/articulo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(express.static(path.join(__dirname, 'public')));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// API Routes
app.use('/api/cursos',            wrap(cursosHandler));
app.use('/api/tareas',            tareasRouter);
app.use('/api/entregas',          wrap(entregasHandler));
app.use('/api/perfil',            wrap(perfilHandler));
app.get('/api/verificarSesion',   (req, res) => verificarSesion(req, res));
app.use('/api/miscursos',         wrap(miscursosHandler));
app.use('/api/participantes',     wrap(participantesHandler));
app.use('/api/usuarios',          wrap(usuariosHandler));
app.use('/api/admin',             wrap(adminHandler));
app.use('/api/calificaciones',    wrap(calificacionesHandler));
app.post('/api/logout',           wrap(logoutHandler));
app.post('/api/procesarformulario', wrap(procesarFormularioHandler));
app.post('/api/actualizar',       wrap(actualizarHandler));
app.use('/api/cambiar_contra',    wrap(cambiarContraHandler));
app.use('/api/materiales',        wrap(materialesHandler));
app.use('/api/alertas',           wrap(alertasHandler));
app.use('/api/recomendaciones',   wrap(recomendacionesHandler));
app.use('/api/articulo',          wrap(articuloHandler));

// Login
app.post('/api/procesarlogin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

  try {
    const [results] = await pool.query(
      'SELECT id, nombre, password, rol FROM usuarios WHERE email = ? AND aprobado = true',
      [email]
    );
    if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado o no aprobado' });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', serialize('user_id', String(user.id), {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      path: '/',
    }));

    return res.json({ redirect: user.rol === 'admin' ? '/admin.html' : '/views/homeuser.html' });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Servir HTML para rutas no-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const isVercel = !!process.env.VERCEL;
const server = http.createServer(app);

if (!isVercel) {
  try { initWebSocket(server); } catch (e) { console.error('WS init failed:', e.message); }
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
