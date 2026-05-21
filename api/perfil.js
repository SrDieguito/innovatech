import { pool } from './db.js';

export default async function handler(req, res) {
  const userId = req.cookies?.user_id;
  if (!userId) return res.status(401).json({ message: 'No autorizado' });

  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query(
        `SELECT id, nombre, email, telefono, procedencia, perfil,
                cedula_ruc_pasaporte, ubicacion, fase, deck, descripcion,
                imagen_perfil, banner, campo_accion, organizacion, rol
         FROM usuarios WHERE id = ?`,
        [userId]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
      const u = rows[0];
      return res.status(200).json({
        id: u.id,
        nombre: u.nombre || 'USUARIO',
        rol: (u.rol || 'usuario').toLowerCase(),
        email: u.email ?? null,
        telefono: u.telefono ?? null,
        procedencia: u.procedencia ?? null,
        perfil: u.perfil ?? null,
        cedula_ruc_pasaporte: u.cedula_ruc_pasaporte ?? null,
        ubicacion: u.ubicacion ?? null,
        fase: u.fase ?? null,
        deck: u.deck ?? null,
        descripcion: u.descripcion ?? null,
        imagen_perfil: u.imagen_perfil ?? null,
        banner: u.banner ?? null,
        campo_accion: u.campo_accion ?? null,
        organizacion: u.organizacion ?? null,
      });
    }

    if (req.method === 'PUT') {
      const { nombre, email, telefono, descripcion } = req.body || {};
      const setParts = [];
      const params = [];

      if (nombre !== undefined && String(nombre).trim()) {
        setParts.push('nombre=?');
        params.push(String(nombre).trim());
      }
      if (email !== undefined && String(email).trim()) {
        setParts.push('email=?');
        params.push(String(email).trim());
      }
      if (telefono !== undefined) {
        setParts.push('telefono=?');
        params.push(String(telefono).trim() || null);
      }
      if (descripcion !== undefined) {
        setParts.push('descripcion=?');
        params.push(String(descripcion).trim() || null);
      }

      if (!setParts.length) return res.status(400).json({ message: 'Nada que actualizar' });
      params.push(userId);

      await pool.query(`UPDATE usuarios SET ${setParts.join(', ')} WHERE id = ?`, params);
      return res.status(200).json({ ok: true, message: 'Perfil actualizado correctamente' });
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en perfil API:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
