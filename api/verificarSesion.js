import { parse } from 'cookie';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret');
const cookieName = 'session';

export default async function handler(req, res) {
  try {
    if (!req.headers.cookie) {
      return res.status(200).json({ autenticado: false, mensaje: 'No hay sesión activa' });
    }

    const cookies = parse(req.headers.cookie);
    const token = cookies[cookieName];

    if (!token) {
      return res.status(200).json({ autenticado: false, mensaje: 'No hay token de sesión' });
    }

    try {
      // Verificar el token JWT
      const { payload } = await jwtVerify(token, secret);
      
      if (!payload?.id) {
        return res.status(200).json({ autenticado: false, mensaje: 'Token inválido' });
      }

      // Devolver los datos del usuario
      return res.status(200).json({
        autenticado: true,
        usuario: {
          id: payload.id,
          rol: payload.rol,
          nombre: payload.nombre,
          email: payload.email
        }
      });
    } catch (error) {
      console.error('Error al verificar el token:', error);
      return res.status(200).json({ 
        autenticado: false, 
        mensaje: 'Sesión expirada o inválida' 
      });
    }
  } catch (error) {
    console.error('Error en verificarSesion:', error);
    return res.status(500).json({ 
      autenticado: false, 
      error: 'Error interno del servidor' 
    });
  }
}
