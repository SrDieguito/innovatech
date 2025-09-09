import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de multer para subir archivos
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const nombre = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
      cb(null, nombre);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

// Handler principal para serverless (Vercel)
export const config = {
  api: { bodyParser: false } // multer maneja body
};

export default async function handler(req, res) {
  try {
    if (req.method === 'POST' && req.url.includes('subir')) {
      // Subir entrega
      upload.single('archivo')(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });

        const { tarea_id } = req.body;
        const archivo = req.file;
        const usuario_id = req.user?.id || 1; // ejemplo, reemplazar por auth real

        if (!tarea_id || !archivo) return res.status(400).json({ success: false, error: "Falta tarea o archivo" });

        const archivo_url = `/uploads/${archivo.filename}`;

        await db.query(`
          INSERT INTO tareas_entregas (tarea_id, usuario_id, archivo_nombre, archivo_url, estado, fecha_entrega)
          VALUES (?, ?, ?, ?, 'entregada', NOW())
          ON DUPLICATE KEY UPDATE
            archivo_nombre = VALUES(archivo_nombre),
            archivo_url = VALUES(archivo_url),
            estado = 'entregada',
            fecha_entrega = NOW()
        `, [tarea_id, usuario_id, archivo.originalname, archivo_url]);

        return res.json({ success: true, message: "Archivo subido y estado actualizado a entregada" });
      });

    } else if (req.method === 'GET' && req.url.includes('detalle')) {
      // Obtener detalle de última entrega
      const tarea_id = req.query.tarea_id;
      const usuario_id = req.user?.id || 1; // ejemplo, reemplazar por auth real

      const [rows] = await db.query(`
        SELECT * FROM tareas_entregas
        WHERE tarea_id = ? AND usuario_id = ?
        ORDER BY fecha_entrega DESC
        LIMIT 1
      `, [tarea_id, usuario_id]);

      if (!rows.length) return res.json(null);
      return res.json(rows[0]);

    } else if (req.method === 'GET' && req.url.includes('descargar')) {
      // Descargar última entrega
      const tarea_id = req.query.tarea_id;
      const usuario_id = req.user?.id || 1;

      const [rows] = await db.query(`
        SELECT * FROM tareas_entregas
        WHERE tarea_id = ? AND usuario_id = ?
        ORDER BY fecha_entrega DESC
        LIMIT 1
      `, [tarea_id, usuario_id]);

      if (!rows.length) return res.status(404).send("No hay entrega");

      const archivoPath = `./public${rows[0].archivo_url}`;
      if (!fs.existsSync(archivoPath)) return res.status(404).send("Archivo no encontrado");

      res.setHeader('Content-Disposition', `attachment; filename="${rows[0].archivo_nombre}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      fs.createReadStream(archivoPath).pipe(res);

    } else if (req.method === 'POST' && req.url.includes('actualizar-vencidas')) {
      // Actualizar vencidas
      await db.query(`
        UPDATE tareas_entregas te
        JOIN tareas t ON te.tarea_id = t.id
        SET te.estado = 'vencida'
        WHERE te.estado = 'pendiente'
          AND NOW() > t.fecha_limite
      `);
      res.json({ success: true, message: 'Estados vencidos actualizados' });

    } else {
      res.status(405).json({ success: false, error: 'Método no permitido' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
