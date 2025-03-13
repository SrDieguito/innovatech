import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());

// Configuración de la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pasantia"
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
    return;
  }
  console.log("Conectado a la base de datos");
});

// Ruta para obtener el perfil de un usuario
app.get("/api/perfil/:id", (req, res) => {
  const userId = req.params.id;
  if (isNaN(userId)) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  const sql = `SELECT nombre, email, telefono, procedencia, perfil, cedula_ruc_pasaporte, 
               ubicacion, fase, deck, descripcion, imagen_perfil, banner, campo_accion, organizacion
               FROM usuarios WHERE id = ?`;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Perfil no encontrado" });
    }
    res.json(result[0]);
  });
});

export default app;