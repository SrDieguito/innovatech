import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
};

app.post("/api/rechazar_usuario", async (req, res) => {
    const { user_id, rejection_reason } = req.body;

    if (!user_id || !rejection_reason) {
        return res.status(400).json({ error: "Faltan datos en la solicitud" });
    }

    try {
        const db = await mysql.createConnection(dbConfig);
        await db.execute(
            "UPDATE usuarios SET estado = ?, motivo_rechazo = ?, fecha_actualizacion = NOW() WHERE id = ?",
            ["rechazado", rejection_reason, user_id]
        );
        await db.end();

        res.json({ message: "Usuario rechazado y motivo guardado." });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor", details: error.message });
    }
});

export default app;
