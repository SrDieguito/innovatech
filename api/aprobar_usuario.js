import express from "express";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();
const app = express();
app.use(express.json());

// Configuración de la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ruta para aprobar usuarios
app.post('/api/aprobar_usuario', async (req, res) => {
    const { user_id } = req.body;

    // Validar que user_id sea un número
    if (!user_id || isNaN(user_id)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Generar contraseña segura
        const passwordRandom = crypto.randomBytes(4).toString("hex"); // 8 caracteres aleatorios
        const hashedPassword = await bcrypt.hash(passwordRandom, 10);
        const defaultImage = '/imagenes/default.png';
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Actualizar usuario en la base de datos
        const [result] = await connection.execute(
            `UPDATE usuarios 
             SET aprobado = 1, password = ?, imagen_perfil = ?, estado = 'aprobado', fecha_actualizacion = ?
             WHERE id = ?`,
            [hashedPassword, defaultImage, fechaActual, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o ya aprobado' });
        }

        // Obtener el email y nombre del usuario
        const [rows] = await connection.execute(
            'SELECT email, nombre FROM usuarios WHERE id = ?', 
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const { email, nombre } = rows[0];

        // Configuración de Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"UTM 2024" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Aprobación de Registro',
            html: `
            <table width="100%" cellspacing="0" cellpadding="0" style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
                <tr>
                    <td align="center">
                        <table width="600px" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center;">
                            <tr>
                                <td align="center" style="padding: 10px;">
                                    <img src="https://innovatech-eosin.vercel.app/imagenes/logo.png" alt="Logo" width="150">
                                    <h2 style="color: #00983d; margin: 10px 0;">¡Tu cuenta ha sido aprobada!</h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px; color: #333; text-align: left;">
                                    <p style="font-size: 16px; margin-bottom: 20px;">
                                        Hola, <strong>${nombre}</strong>,<br><br>
                                        Te informamos que tu solicitud ha sido aprobada. Ahora puedes acceder a la plataforma con tu contraseña temporal:
                                    </p>
                                    <p style="font-size: 18px; font-weight: bold; background-color: #f4f4f4; padding: 10px; border-radius: 5px; display: inline-block;">
                                        ${passwordRandom}
                                    </p>
                                    <p style="font-size: 14px; color: #777;">
                                        Por favor, inicia sesión y cambia tu contraseña lo antes posible por razones de seguridad.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px;">
                                    <a href="https://innovatech-eosin.vercel.app/auth/login.html" 
                                        style="background-color: #00983d; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-size: 16px; display: inline-block;">
                                        Iniciar sesión
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 10px; font-size: 12px; color: #777;">
                                    © 2025 Innovatech. Todos los derechos reservados.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        `
        };

        await transporter.sendMail(mailOptions);
        
        res.json({ success: true, message: "Usuario aprobado y correo enviado correctamente." });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno', details: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Exportar la app para Vercel
export default app;
