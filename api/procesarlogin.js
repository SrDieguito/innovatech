import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { serialize } from "cookie";
import cookieParser from "cookie-parser"; // 🔹 Importamos cookie-parser

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // 🔹 Habilitamos el middleware para manejar cookies

// Ruta de login
app.post("/api/procesarlogin", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

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

        if (results.length === 0) {
            return res.status(401).json({ error: "Usuario no encontrado o no aprobado" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // Configurar la cookie con el user_id en lugar de un token manual
        res.setHeader("Set-Cookie", serialize("user_id", String(user.id), {
            httpOnly: true, 
            secure: true, // Cambia a false si pruebas en localhost
            sameSite: "None",
            path: "/"
        }));

        return res.json({ redirect: user.rol === "admin" ? "/admin.html" : "/views/perfil_usuario.html" });
    } catch (error) {
        console.error("Error en el servidor:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    } finally {
        if (conn) await conn.end();
    }
});

// 🔹 Ahora Express reconocerá `req.cookies.user_id` correctamente
app.get("/api/verificarSesion", (req, res) => {
    const userId = req.cookies.user_id;
    if (userId) {
        res.json({ autenticado: true, user_id: userId });
    } else {
        res.status(401).json({ autenticado: false });
    }
});

export default app;
