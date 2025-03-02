import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const {
    nombre,
    email,
    telefono,
    perfil,
    organizacion,
    cedula_ruc_pasaporte,
    ubicacion,
    fase,
    pitches,
    deck,
    descripcion,
    campo_accion,
  } = req.body;

  if (!nombre || !email || !telefono) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const fecha_actualizacion = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    // Conexión a MySQL usando la configuración adecuada
    const conn = await mysql.createConnection({
      host: "shinkansen.proxy.rlwy.net", // Usar el host interno
      user: "root",                   // El nombre de usuario
      password: "nulxOVOMEauNtyOMWtjloNSuAFdgghYV", // La contraseña
      database: "pasantia",           // El nombre de la base de datos
      port: 31839                      // El puerto de la base de datos (usualmente 3306 para MySQL)
    });

    // Verificar si el email ya existe
    const [rows] = await conn.execute("SELECT id FROM usuarios WHERE email = ?", [email]);

    if (rows.length > 0) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado." });
    }

    // Insertar datos en la base de datos
    await conn.execute(
      `INSERT INTO usuarios (nombre, email, telefono, perfil, organizacion, cedula_ruc_pasaporte, ubicacion, fase, pitches, deck, descripcion, campo_accion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, email, telefono, perfil, organizacion, cedula_ruc_pasaporte, ubicacion, fase, pitches, deck, descripcion, campo_accion, fecha_actualizacion]
    );

    conn.end();

    // Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "crafteo727@gmail.com",
        pass: "naek pyan xphb bseo",
      },
    });

    // Enviar correo
    await transporter.sendMail({
      from: '"UTM 2024" <crafteo727@gmail.com>',
      to: "srdieguit@gmail.com",
      subject: "Nuevo registro de usuario",
      html: `<p>El usuario ${nombre} (${email}) ha solicitado registrarse.</p>`,
    });

    return res.status(200).json({ message: "Registro enviado correctamente" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
}
