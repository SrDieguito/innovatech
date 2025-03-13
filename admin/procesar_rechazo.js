import express from 'express';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

app.post('/api/reject-user', async (req, res) => {
    const { user_id, rejection_reason } = req.body;
    if (!user_id || !rejection_reason) {
        return res.status(400).json({ error: 'Falta información para procesar la solicitud.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT email FROM usuarios WHERE id = ?', [user_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const email = rows[0].email;
        await connection.execute('UPDATE usuarios SET estado = ?, motivo_rechazo = ?, fecha_actualizacion = NOW() WHERE id = ?', ['rechazado', rejection_reason, user_id]);
        await connection.end();

        // Configurar nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Solicitud de Participación Rechazada',
            html: `<p>Estimado usuario,</p><p>Su solicitud ha sido rechazada por el siguiente motivo:</p><p>${rejection_reason}</p><p>Saludos cordiales,</p><p>El equipo de UTM 2024</p>`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Usuario rechazado correctamente y notificado por correo.' });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
});

export default app;
