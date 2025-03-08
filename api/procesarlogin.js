const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
require("dotenv").config();

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

// Configuración de la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pasantia",
});

db.connect((err) => {
  if (err) {
    console.error("Error de conexión a la base de datos:", err);
    return;
  }
  console.log("Conectado a la base de datos");
});

// Ruta de login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  const sql = "SELECT id, nombre, password, rol FROM usuarios WHERE email = ? AND aprobado = 1";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
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

    // Redirección según el rol
    if (user.rol === "admin") {
      return res.json({ redirect: "/admin/interfaz_administracion" });
    } else {
      return res.json({ redirect: "/views/perfil_usuario" });
    }
  });
});

module.exports = app;
