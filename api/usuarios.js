// File: /api/usuarios.js

import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { rol } = req.query;

    if (!rol) {
      return res.status(400).json({ error: "El parámetro 'rol' es requerido." });
    }

    try {
      console.log("Parámetro rol:", rol);

      const [rows] = await pool.query(
        "SELECT id, nombre FROM usuarios WHERE rol = ?",
        [rol]
      );

      console.log("Usuarios encontrados:", rows);

      return res.status(200).json(rows);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }

  return res.status(405).json({ error: "Método no permitido." });
}
