// api/entregas.js
import { pool } from './db.js';
import fs from 'node:fs/promises';

function getUserId(req){ return req.cookies?.user_id || null; }

async function isAdminOrProfesor(userId){
  const [[u]] = await pool.query('SELECT rol FROM usuarios WHERE id=?',[userId]);
  if(!u) return false;
  return ['admin','profesor'].includes(String(u.rol||'').toLowerCase());
}
async function isProfesorDelCurso(userId, tareaId){
  const [[row]] = await pool.query(`
    SELECT c.profesor_id
    FROM tareas t JOIN cursos c ON t.curso_id=c.id
    WHERE t.id=?`, [tareaId]);
  if(!row) return false;
  return Number(row.profesor_id) === Number(userId);
}
async function estudianteInscritoEnTarea(estudianteId, tareaId){
  // Cambia el nombre de la tabla si tu esquema difiere
  const [[row]] = await pool.query(`
    SELECT 1
    FROM tareas t 
    JOIN cursos_estudiantes ce ON ce.curso_id = t.curso_id
    WHERE t.id=? AND ce.estudiante_id=?`, [tareaId, estudianteId]);
  return !!row;
}

export default async function handler(req,res){
  const { action } = req.query || {};

  try{
    // ---------- PING ----------
    if (req.method === 'GET' && action === 'ping') {
      return res.status(200).json({ ok:true });
    }

    // ---------- SUBIR (estudiante) ----------
    if(req.method==='POST' && action==='subir'){
      const userId = getUserId(req);
      if(!userId) return res.status(401).json({ error:'No autenticado' });

      // Import dinámico: evita 500 en GET si formidable no está instalado
      const { default: formidable } = await import('formidable');

      const form = formidable({
        multiples:false,
        maxFileSize: 2 * 1024 * 1024, // 2MB
        filter: part => part.mimetype && part.originalFilename
      });

      const { fields, files } = await new Promise((resolve,reject)=>{
        form.parse(req,(err,fields,files)=> err?reject(err):resolve({fields,files}));
      });

      const tarea_id = Number(fields.tarea_id?.toString() || 0);
      if(!tarea_id) return res.status(400).json({ error:'tarea_id requerido' });

      if(!(await estudianteInscritoEnTarea(userId, tarea_id))){
        return res.status(403).json({ error:'No puedes entregar esta tarea' });
      }

      const file = files?.archivo;
      const f = Array.isArray(file) ? file[0] : file;
      if(!f) return res.status(400).json({ error:'archivo requerido' });

      const size = Number(f.size || 0);
      if(size <= 0 || size > 2*1024*1024) return res.status(413).json({ error:'Archivo supera 2MB' });

      const allowed = new Set([
        'application/pdf',
        'image/png','image/jpeg','image/jpg',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]);
      const mime = f.mimetype || 'application/octet-stream';
      if(!allowed.has(mime)) return res.status(415).json({ error:'Tipo de archivo no permitido' });

      const buf = await fs.readFile(f.filepath);
      const nombre = f.originalFilename || 'archivo';

      await pool.query(`
        INSERT INTO tareas_entregas
          (tarea_id, estudiante_id, archivo_nombre, archivo_mime, archivo_blob, tamano_bytes, estado, fecha_entrega)
        VALUES (?, ?, ?, ?, ?, ?, 'entregado', NOW())
        ON DUPLICATE KEY UPDATE
          archivo_nombre=VALUES(archivo_nombre),
          archivo_mime=VALUES(archivo_mime),
          archivo_blob=VALUES(archivo_blob),
          tamano_bytes=VALUES(tamano_bytes),
          estado='entregado',
          fecha_entrega=NOW(),
          calificacion=NULL,
          observacion=NULL
      `, [tarea_id, userId, nombre, mime, buf, size]);

      return res.status(201).json({ ok:true, message:'Entregado' });
    }

    // ---------- MIS ENTREGAS (estudiante) ----------
    if(req.method==='GET' && action==='mis'){
      const userId = getUserId(req);
      if(!userId) return res.status(401).json({ error:'No autenticado' });

      const curso_id = Number(req.query.curso_id||0);
      if(!curso_id) return res.status(400).json({ error:'curso_id requerido' });

      try{
        const [rows] = await pool.query(`
          SELECT e.id, e.tarea_id, e.fecha_entrega, e.estado, e.calificacion
          FROM tareas_entregas e
          JOIN tareas t ON t.id=e.tarea_id
          WHERE t.curso_id=CAST(? AS UNSIGNED) AND e.estudiante_id=CAST(? AS UNSIGNED)
        `, [curso_id, userId]);

        const map = {};
        for(const r of rows){
          map[r.tarea_id] = {
            entrega_id: r.id,
            entregado: true,
            fecha: r.fecha_entrega,
            estado: r.estado,
            calificacion: r.calificacion
          };
        }
        return res.status(200).json(map);
      }catch(dbErr){
        console.error('entregas:mis sql error', dbErr);
        // No rompas la UI si hay un fallo SQL puntual
        return res.status(200).json({});
      }
    }

    // ---------- ENTREGAS POR TAREA (profesor) ----------
    if(req.method==='GET' && action==='por_tarea'){
      const userId = getUserId(req);
      if(!userId) return res.status(401).json({ error:'No autenticado' });

      const tarea_id = Number(req.query.tarea_id||0);
      if(!tarea_id) return res.status(400).json({ error:'tarea_id requerido' });

      const isProf = (await isAdminOrProfesor(userId)) || (await isProfesorDelCurso(userId, tarea_id));
      if(!isProf) return res.status(403).json({ error:'No autorizado' });

      try{
        const [rows] = await pool.query(`
          SELECT e.id, e.tarea_id, e.estudiante_id, u.nombre AS estudiante,
                 e.archivo_nombre, e.tamano_bytes, e.fecha_entrega, e.estado, e.calificacion, e.observacion
          FROM tareas_entregas e
          JOIN usuarios u ON u.id=e.estudiante_id
          WHERE e.tarea_id=CAST(? AS UNSIGNED)
          ORDER BY e.fecha_entrega DESC
        `, [tarea_id]);

        return res.status(200).json(rows);
      }catch(dbErr){
        console.error('entregas:por_tarea sql error', dbErr);
        return res.status(200).json([]);
      }
    }

    // ---------- DESCARGAR (profesor o dueño) ----------
    if(req.method==='GET' && action==='descargar'){
      const userId = getUserId(req);
      if(!userId) return res.status(401).json({ error:'No autenticado' });
      const id = Number(req.query.id||0);
      if(!id) return res.status(400).json({ error:'id requerido' });

      const [[row]] = await pool.query(`
        SELECT e.*, t.curso_id, c.profesor_id
        FROM tareas_entregas e
        JOIN tareas t ON t.id=e.tarea_id
        JOIN cursos c ON c.id = t.curso_id
        WHERE e.id=CAST(? AS UNSIGNED)`, [id]);
      if(!row) return res.status(404).json({ error:'No encontrada' });

      const isOwner = Number(row.estudiante_id)===Number(userId);
      const isProf  = Number(row.profesor_id)===Number(userId) || await isAdminOrProfesor(userId);
      if(!isOwner && !isProf) return res.status(403).json({ error:'No autorizado' });

      res.setHeader('Content-Type', row.archivo_mime);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.archivo_nombre)}"`);
      return res.status(200).send(row.archivo_blob);
    }

    // ---------- CALIFICAR (profesor) ----------
    if(req.method==='PUT' && action==='calificar'){
      const userId = getUserId(req);
      if(!userId) return res.status(401).json({ error:'No autenticado' });

      const { id, calificacion=null, observacion=null } = req.body || {};
      if(!id) return res.status(400).json({ error:'id requerido' });

      const [[row]] = await pool.query(`
        SELECT t.id AS tarea_id FROM tareas_entregas e 
        JOIN tareas t ON t.id=e.tarea_id
        WHERE e.id=CAST(? AS UNSIGNED)`, [id]);
      if(!row) return res.status(404).json({ error:'Entrega no encontrada' });

      if(!(await isProfesorDelCurso(userId, row.tarea_id)) && !(await isAdminOrProfesor(userId))){
        return res.status(403).json({ error:'No autorizado' });
      }

      await pool.query(`
        UPDATE tareas_entregas
        SET calificacion=?, observacion=?, estado='revisado'
        WHERE id=CAST(? AS UNSIGNED)`, [calificacion, observacion, id]);

      return res.status(200).json({ ok:true });
    }

    return res.status(400).json({ error:'Acción inválida o método no soportado' });
  }catch(err){
    console.error('Error en entregas API:', err);
    const code = /maxFileSize/i.test(String(err)) ? 413 : 500;
    return res.status(code).json({ error:'Error interno del servidor', details: err.message });
  }
}
