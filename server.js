import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import http from 'http';

import { initWebSocket } from './wsServer.js';
import cursosRouter from './api/cursos.js';
import tareasRouter from './api/tareas.js';
import entregasHandler from './api/entregas.js';
import perfilHandler from './api/perfil.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/cursos', cursosRouter);
app.use('/api/tareas', tareasRouter);
app.use('/api/entregas', (req, res, next) => Promise.resolve(entregasHandler(req, res)).catch(next));
app.use('/api/perfil',   (req, res, next) => Promise.resolve(perfilHandler(req, res)).catch(next));

// Login
app.post('/api/procesarlogin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y contraseña son requeridos" });

  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const sql = "SELECT id, nombre, password, rol FROM usuarios WHERE email = ? AND aprobado = 1";
    const [results] = await conn.execute(sql, [email]);
    if (results.length === 0) return res.status(401).json({ error: "Usuario no encontrado o no aprobado" });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.setHeader("Set-Cookie", serialize("user_id", String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "None",
      path: "/"
    }));

    return res.json({ redirect: user.rol === "admin" ? "/admin.html" : "/views/homeuser.html" });
  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  } finally {
    if (conn) await conn.end();
  }
});

// Verificar sesión
app.get('/api/verificarSesion', (req, res) => {
  const userId = req.cookies.user_id;
  if (userId) res.json({ autenticado: true, user_id: userId });
  else res.status(401).json({ autenticado: false });
});

// Servir HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Crear servidor HTTP y WebSocket
const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
