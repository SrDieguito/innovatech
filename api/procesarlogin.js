import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs"; // Usamos bcryptjs por compatibilidad
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Ruta de login
app.post("/api/procesarlogin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  let conn;
  try {
    // Conexión directa a MySQL
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const sql = "SELECT id, nombre, password, rol FROM usuarios WHERE email = ? AND aprobado = 1";
    const [results] = await conn.execute(sql, [email]);

    if (results.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado o no aprobado" });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Iniciar sesión
    req.session.user_id = user.id;
    req.session.user_name = user.nombre;
    req.session.user_rol = user.rol;

    return res.json({ redirect: user.rol === "admin" ? "/admin/dashboardadmin" : "/views/perfil_usuario" });
  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  } finally {
    if (conn) await conn.end(); // Cerrar conexión en cualquier caso
  }
});

export default app;
