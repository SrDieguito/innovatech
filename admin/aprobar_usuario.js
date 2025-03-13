const express = require('express');
const mysql = require('mysql2/promise'); // Usar promesas
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Configuración de la base de datos con pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ruta para aprobar usuarios y enviar correo
app.get('/aprobar-usuario', async (req, res) => {
    const usuarioId = req.query.id;
    if (!usuarioId) {
        return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    try {
        const passwordRandom = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(passwordRandom, 10);
        const defaultImage = 'imagenes/default.png';
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const connection = await pool.getConnection();

        // Actualizar usuario en la base de datos
        await connection.execute(
            `UPDATE usuarios 
             SET aprobado = 1, password = ?, imagen_perfil = ?, estado = 'aprobado', fecha_actualizacion = ?
             WHERE id = ?`,
            [hashedPassword, defaultImage, fechaActual, usuarioId]
        );

        // Obtener el email del usuario
        const [results] = await connection.execute('SELECT email FROM usuarios WHERE id = ?', [usuarioId]);
        connection.release(); // Liberar conexión

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const email = results[0].email;

        // Configuración de Nodemailer
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Aprobación de Registro',
            html: `
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
                    <h2 style="text-align: center;">¡Tu cuenta ha sido aprobada!</h2>
                    <p>Hola,</p>
                    <p>Te informamos que tu solicitud ha sido aprobada.</p>
                    <p><strong>Tu contraseña temporal es:</strong> <b>${passwordRandom}</b></p>
                    <p>Por favor, inicia sesión y cambia tu contraseña.</p>
                    <p>Saludos,<br>El equipo de UTM 2024</p>
                </div>
            </body>
            </html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.redirect('/admin/admin.html.js?status=success');
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Exportar la app para Vercel
module.exports = app;
