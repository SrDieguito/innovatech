const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) {
        console.error("Error conectando a la BD:", err);
        return;
    }
    console.log("Conectado a la BD MySQL");
});

// Obtener usuarios por estado
app.get("/api/usuarios/:estado", (req, res) => {
    const estado = req.params.estado;
    const query = "SELECT * FROM usuarios WHERE estado = ?";
    db.query(query, [estado], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error en la consulta" });
        }
        res.json(results);
    });
});

// Aprobar usuario
app.post("/api/usuarios/aprobar", (req, res) => {
    const { id } = req.body;
    const query = "UPDATE usuarios SET estado = 'aprobado' WHERE id = ?";
    db.query(query, [id], err => {
        if (err) {
            return res.status(500).json({ error: "Error actualizando el usuario" });
        }
        res.json({ message: "Usuario aprobado" });
    });
});

// Rechazar usuario
app.post("/api/usuarios/rechazar", (req, res) => {
    const { id } = req.body;
    const query = "UPDATE usuarios SET estado = 'rechazado' WHERE id = ?";
    db.query(query, [id], err => {
        if (err) {
            return res.status(500).json({ error: "Error actualizando el usuario" });
        }
        res.json({ message: "Usuario rechazado" });
    });
});

module.exports = app;
