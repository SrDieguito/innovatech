import { pool } from './db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { estado } = req.query;
    if (!estado) return res.status(400).json({ error: 'Falta el estado en la solicitud' });

    try {
      const [results] = await pool.query('SELECT * FROM usuarios WHERE estado = ?', [estado]);
      return res.status(200).json(results);
    } catch (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: 'Error en la consulta' });
    }
  }

  if (req.method === 'POST') {
    const { id, accion } = req.body;
    if (!id || !['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'Solicitud incorrecta' });
    }

    const nuevoEstado = accion === 'aprobar' ? 'aprobado' : 'rechazado';
    try {
      await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', [nuevoEstado, id]);
      return res.status(200).json({ message: `Usuario ${nuevoEstado}` });
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      return res.status(500).json({ error: 'Error actualizando el usuario' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
