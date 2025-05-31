// File: /api/usuarios.js

import { pool } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { rol } = req.query;

    if (!rol) {
      return res.status(400).json({ error: "El parámetro 'rol' es requerido." });
    }

    try {
      // Ahora sin filtro de estado
      const [rows] = await pool.query(
        "SELECT id, nombre FROM usuarios WHERE rol = ?",
        [rol]
      );
      return res.status(200).json(rows);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }

  return res.status(405).json({ error: "Método no permitido." });
}
