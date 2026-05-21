import { pool } from './db.js';
import bcrypt from 'bcryptjs';

export { pool };

function getUserId(req) {
  return req.cookies?.user_id || null;
}

async function isAdmin(userId) {
  if (!userId) return false;
  const [[u]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);
  return u?.rol === 'admin';
}

export default async function handler(req, res) {
  const action = req.query?.action || '';

  try {
    // GET ?action=listar&rol=profesor  — lista usuarios por rol
    if (req.method === 'GET' && action === 'listar') {
      const { rol } = req.query;
      if (!rol) return res.status(400).json({ error: "El parámetro 'rol' es requerido." });
      const [rows] = await pool.query('SELECT id, nombre, email FROM usuarios WHERE rol = ?', [rol]);
      return res.status(200).json(rows);
    }

    // GET ?action=profesores  — alias rápido para el selector del admin
    if (req.method === 'GET' && action === 'profesores') {
      const [rows] = await pool.query("SELECT id, nombre, email FROM usuarios WHERE rol = 'profesor' ORDER BY nombre");
      return res.status(200).json(rows);
    }

    // POST ?action=crear-profesor  — admin crea un nuevo profesor
    if (req.method === 'POST' && action === 'crear-profesor') {
      const adminId = getUserId(req);
      if (!await isAdmin(adminId)) return res.status(403).json({ error: 'Solo el admin puede crear profesores' });

      const { nombre, email, password, telefono, descripcion, organizacion } = req.body || {};
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
      if (!email?.trim())  return res.status(400).json({ error: 'El email es obligatorio' });
      if (!password)       return res.status(400).json({ error: 'La contraseña es obligatoria' });
      if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

      const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
      if (existing.length > 0) return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

      const hash = await bcrypt.hash(password, 12);
      const [rows] = await pool.query(
        `INSERT INTO usuarios (nombre, email, password, telefono, descripcion, organizacion, rol, estado, aprobado)
         VALUES (?, ?, ?, ?, ?, ?, 'profesor', 'aprobado', true) RETURNING id, nombre, email, rol`,
        [nombre.trim(), email.trim().toLowerCase(), hash, telefono || null, descripcion || null, organizacion || null]
      );
      return res.status(201).json({ success: true, usuario: rows[0] });
    }

    // PUT ?action=editar-profesor  — admin edita un profesor existente
    if (req.method === 'PUT' && action === 'editar-profesor') {
      const adminId = getUserId(req);
      if (!await isAdmin(adminId)) return res.status(403).json({ error: 'Solo el admin puede editar profesores' });

      const { id, nombre, email, password, telefono, descripcion, organizacion } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id requerido' });

      const parts = []; const params = [];
      if (nombre)       { parts.push('nombre=?');       params.push(nombre.trim()); }
      if (email)        { parts.push('email=?');         params.push(email.trim().toLowerCase()); }
      if (telefono !== undefined) { parts.push('telefono=?');    params.push(telefono || null); }
      if (descripcion !== undefined) { parts.push('descripcion=?'); params.push(descripcion || null); }
      if (organizacion !== undefined) { parts.push('organizacion=?'); params.push(organizacion || null); }
      if (password) {
        if (password.length < 6) return res.status(400).json({ error: 'Contraseña muy corta' });
        parts.push('password=?');
        params.push(await bcrypt.hash(password, 12));
      }
      if (!parts.length) return res.status(400).json({ error: 'Nada para actualizar' });
      params.push(id);
      await pool.query(`UPDATE usuarios SET ${parts.join(', ')} WHERE id = ? AND rol = 'profesor'`, params);
      return res.status(200).json({ success: true });
    }

    // DELETE ?action=eliminar-profesor&id=X
    if (req.method === 'DELETE' && action === 'eliminar-profesor') {
      const adminId = getUserId(req);
      if (!await isAdmin(adminId)) return res.status(403).json({ error: 'Solo el admin puede eliminar profesores' });
      const id = req.query.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'id requerido' });
      await pool.query("DELETE FROM usuarios WHERE id = ? AND rol = 'profesor'", [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Acción inválida o método no soportado' });
  } catch (err) {
    console.error('Error en usuarios API:', err);
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
