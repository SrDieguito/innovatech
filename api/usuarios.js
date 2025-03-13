import { connectToDatabase } from "../../includes/db"; // Asegúrate de que este archivo maneja la conexión a la DB.

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const estado = req.query.estado; // Capturar estado desde la URL
        if (!estado) {
            return res.status(400).json({ error: "Falta el estado en la solicitud" });
        }

        const db = await connectToDatabase();
        const usuarios = await db.collection("usuarios").find({ estado }).toArray(); // Suponiendo que usas MongoDB
        
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
