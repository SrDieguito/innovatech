import bcrypt from 'bcryptjs';
import { authMiddleware } from './middleware.js';
import { pool } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const userId = await authMiddleware(req, res);
    if (!userId) return;

    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Se requieren ambas contraseñas' });
    }

    const [rows] = await pool.query('SELECT password FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const passwordMatch = await bcrypt.compare(old_password, rows[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, userId]);

    return res.json({ message: 'Contraseña cambiada con éxito' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}
