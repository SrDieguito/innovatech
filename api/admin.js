import mysql from "mysql2/promise";

export default async function handler(req, res) {
    console.log("Método recibido:", req.method);
    
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    if (req.method === "GET") {
        const estado = req.query.estado;
        console.log("Estado recibido:", estado);

        if (!estado) {
            return res.status(400).json({ error: "Falta el estado en la solicitud" });
        }
        try {
            const [results] = await db.execute("SELECT * FROM usuarios WHERE estado = ?", [estado]);
            console.log("Usuarios obtenidos:", results);
            res.status(200).json(results);
        } catch (err) {
            console.error("Error en la consulta:", err);
            res.status(500).json({ error: "Error en la consulta" });
        }
    } else if (req.method === "POST") {
        const { id, accion } = req.body;
        console.log("Datos recibidos para actualización:", id, accion);

        if (!id || !["aprobar", "rechazar"].includes(accion)) {
            return res.status(400).json({ error: "Solicitud incorrecta" });
        }

        const nuevoEstado = accion === "aprobar" ? "aprobado" : "rechazado";
        try {
            await db.execute("UPDATE usuarios SET estado = ? WHERE id = ?", [nuevoEstado, id]);
            console.log(`Usuario ${id} cambiado a estado: ${nuevoEstado}`);
            res.status(200).json({ message: `Usuario ${nuevoEstado}` });
        } catch (err) {
            console.error("Error actualizando usuario:", err);
            res.status(500).json({ error: "Error actualizando el usuario" });
        }
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
}
