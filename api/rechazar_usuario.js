import express from "express";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
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

    let db;
    try {
        db = await mysql.createConnection(dbConfig);

        // Obtener el email del usuario antes de actualizar
        const [userResult] = await db.execute("SELECT email FROM usuarios WHERE id = ?", [user_id]);
        if (userResult.length === 0) {
            await db.end();
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const email = userResult[0].email;

        // Actualizar estado y motivo del rechazo
        await db.execute(
            "UPDATE usuarios SET estado = ?, motivo_rechazo = ?, fecha_actualizacion = NOW() WHERE id = ?",
            ["rechazado", rejection_reason, user_id]
        );

        await db.end();

        // Configurar Nodemailer
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Definir contenido del correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Notificación de rechazo",
            html: `
                <table width="100%" cellspacing="0" cellpadding="0" style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
                    <tr>
                        <td align="center">
                            <table width="600px" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center;">
                                <!-- Encabezado -->
                                <tr>
                                    <td align="center" style="padding: 10px;">
                                        <img src="https://innovatech-eosin.vercel.app/imagenes/logo.png" alt="Logo" width="150">
                                        <h2 style="color: #d9534f; margin: 10px 0;">Tu solicitud ha sido rechazada</h2>
                                    </td>
                                </tr>

                                <!-- Contenido del correo -->
                                <tr>
                                    <td style="padding: 20px; color: #333; text-align: left;">
                                        <p style="font-size: 16px; margin-bottom: 20px;">
                                            Hola,<br><br>
                                            Lamentamos informarte que tu solicitud ha sido rechazada por el siguiente motivo:
                                        </p>
                                        <p style="font-size: 18px; font-weight: bold; background-color: #f4f4f4; padding: 10px; border-radius: 5px; display: inline-block; color: #d9534f;">
                                            ${rejection_reason}
                                        </p>
                                        <p style="font-size: 14px; color: #777;">
                                            Si crees que esto fue un error, puedes volver a enviar la solicitud de registro.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Pie de página -->
                                <tr>
                                    <td align="center" style="padding: 10px; font-size: 12px; color: #777;">
                                        © 2025 Innovatech. Todos los derechos reservados.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            `,
        };

        // Enviar correo
        await transporter.sendMail(mailOptions);

        res.json({ message: "Usuario rechazado, motivo guardado y correo enviado." });

    } catch (error) {
        if (db) await db.end();
        console.error("Error al rechazar usuario:", error);
        res.status(500).json({ error: "Error en el servidor", details: error.message });
    }
});

export default app;
