import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  let conn;
  try {
    const {
      nombre, email, telefono, perfil, organizacion,
      cedula_ruc_pasaporte, ubicacion, fase, pitches,
      deck, descripcion, campo_accion, campo_accion_otro
    } = req.body;

    // Verificar que los datos obligatorios existen
    if (!nombre || !email || !telefono) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Conexión a MySQL
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    // Verificar si el email ya existe
    const [rows] = await conn.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado." });
    }

    // Reemplazar valores undefined con null
    const safeData = {
      nombre: nombre || null,
      email: email || null,
      telefono: telefono || null,
      perfil: perfil || null,
      organizacion: organizacion || null,
      cedula_ruc_pasaporte: cedula_ruc_pasaporte || null,
      ubicacion: ubicacion || null,
      fase: fase || null,
      pitches: pitches || null,
      deck: deck || null,
      descripcion: descripcion || null,
      campo_accion: campo_accion === "Otros" ? campo_accion_otro || null : campo_accion || null,
      fecha_actualizacion: new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    // Insertar datos en la base de datos
    await conn.execute(
      `INSERT INTO usuarios (nombre, email, telefono, perfil, organizacion, cedula_ruc_pasaporte,
        ubicacion, fase, pitches, deck, descripcion, campo_accion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      Object.values(safeData)
    );

    // Cerrar conexión
    await conn.end();

    // Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enviar correo de confirmación
    await transporter.sendMail({
      from: `"UTM 2024" <${process.env.EMAIL_USER}>`,
      to: "srdieguit@gmail.com",
      subject: "Nuevo registro de usuario",
      html: `<p>El usuario ${nombre} (${email}) ha solicitado registrarse.</p>`,
    });

    return res.status(200).json({ message: "Registro enviado correctamente" });

  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  } finally {
    if (conn) await conn.end(); // Asegurar que la conexión se cierre
  }
}
