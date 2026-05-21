import { pool } from './db.js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const {
      nombre, email, telefono, perfil, organizacion,
      cedula_ruc_pasaporte, ubicacion, fase, pitches,
      deck, descripcion, campo_accion, campo_accion_otro,
    } = req.body;

    if (!nombre || !email || !telefono) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    await pool.query(
      `INSERT INTO usuarios
         (nombre, email, telefono, perfil, organizacion, cedula_ruc_pasaporte,
          ubicacion, fase, pitches, deck, descripcion, campo_accion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nombre || null, email || null, telefono || null,
        perfil || null, organizacion || null, cedula_ruc_pasaporte || null,
        ubicacion || null, fase || null, pitches || null,
        deck || null, descripcion || null,
        campo_accion === 'Otros' ? (campo_accion_otro || null) : (campo_accion || null),
      ]
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"UTM 2024" <${process.env.EMAIL_USER}>`,
      to: 'srdieguit@gmail.com',
      subject: 'Nuevo registro de usuario',
      html: `<p><strong>${nombre}</strong> (${email}) ha solicitado registrarse en la plataforma.</p>`,
    });

    return res.status(200).json({ message: 'Registro enviado correctamente' });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}
