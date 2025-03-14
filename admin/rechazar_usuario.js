import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
};

// Ruta para procesar el rechazo del usuario
app.post("/api/process-rejection", async (req, res) => {
    const { user_id, rejection_reason } = req.body;

    if (!user_id || !rejection_reason) {
        return res.status(400).json({ error: "Faltan datos en la solicitud" });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // ✅ **Actualizar la base de datos con el motivo del rechazo**
        await connection.execute(
            "UPDATE usuarios SET estado = ?, motivo_rechazo = ?, fecha_actualizacion = NOW() WHERE id = ?",
            ["rechazado", rejection_reason, user_id]
        );
        
        await connection.end();
        
        console.log(`✅ Usuario ${user_id} rechazado con motivo: ${rejection_reason}`);
        
        // Redirigir correctamente a la interfaz del administrador
        res.redirect("/admin/admin.html?status=rejected");
    } catch (error) {
        console.error("❌ Error al actualizar el usuario:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});
