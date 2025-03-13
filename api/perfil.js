import mysql from "mysql2/promise";

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Falta el ID del usuario" });
    }

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });

    try {
        const [result] = await db.execute("SELECT * FROM usuarios WHERE id = ?", [id]);
        if (result.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: "Error en la base de datos" });
    }
}
