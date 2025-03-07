const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pasantia'
});

db.connect(err => {
    if (err) {
        console.error('Error de conexión a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Ruta para aprobar usuarios y enviar correo
app.get('/aprobar-usuario', async (req, res) => {
    const usuarioId = req.query.id;
    if (!usuarioId) {
        return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    try {
        // Generar una contraseña aleatoria y encriptarla
        const passwordRandom = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(passwordRandom, 10);

        const defaultImage = 'imagenes/default.png';
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Actualizar usuario en la base de datos
        const sqlUpdate = `UPDATE usuarios 
                           SET aprobado = 1, password = ?, imagen_perfil = ?, estado = 'aprobado', fecha_actualizacion = ?
                           WHERE id = ?`;
        db.query(sqlUpdate, [hashedPassword, defaultImage, fechaActual, usuarioId], async (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar usuario', details: err });
            }

            // Obtener el email del usuario
            const sqlSelect = 'SELECT email FROM usuarios WHERE id = ?';
            db.query(sqlSelect, [usuarioId], async (err, results) => {
                if (err || results.length === 0) {
                    return res.status(500).json({ error: 'Error al obtener el email del usuario' });
                }
                const email = results[0].email;

                // Configuración de Nodemailer
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER, // Usa variables de entorno
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

                // Enviar correo
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al enviar el correo', details: err });
                    }
                    res.redirect('/admin/interfaz_administracion.js?status=success');
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
