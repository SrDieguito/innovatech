import mysql from "mysql2/promise";

export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });

    if (req.method === "GET") {
        // Obtener usuarios por estado
        const estado = req.query.estado;
        if (!estado) {
            return res.status(400).json({ error: "Falta el estado en la solicitud" });
        }
        try {
            const [results] = await db.execute("SELECT * FROM usuarios WHERE estado = ?", [estado]);
            res.status(200).json(results);
        } catch (err) {
            res.status(500).json({ error: "Error en la consulta" });
        }
    } else if (req.method === "POST") {
        // Aprobar o rechazar usuario
        const { id, accion } = req.body;
        if (!id || !["aprobar", "rechazar"].includes(accion)) {
            return res.status(400).json({ error: "Solicitud incorrecta" });
        }

        const nuevoEstado = accion === "aprobar" ? "aprobado" : "rechazado";
        try {
            await db.execute("UPDATE usuarios SET estado = ? WHERE id = ?", [nuevoEstado, id]);
            res.status(200).json({ message: `Usuario ${nuevoEstado}` });
        } catch (err) {
            res.status(500).json({ error: "Error actualizando el usuario" });
        }
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
}
