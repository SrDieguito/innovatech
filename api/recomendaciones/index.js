import { pickQuery, toInt, ok, fail } from '../_utils/params.js';
import { pool } from '../_utils/db.js';

// External resource fallbacks
const EXTERNAL_RESOURCES = (term) => {
  const q = encodeURIComponent(term || 'matemáticas fundamentos');
  return [
    { 
      id: -1, 
      titulo: 'Khan Academy - búsqueda', 
      url: `https://www.khanacademy.org/search?page_search_query=${q}`,
      descripcion: 'Recursos relacionados',
      es_externo: true
    },
    { 
      id: -2, 
      titulo: 'OpenStax - búsqueda', 
      url: `https://openstax.org/search?query=${q}`,
      descripcion: 'Libros y secciones',
      es_externo: true
    },
    { 
      id: -3, 
      titulo: 'LibreTexts - búsqueda', 
      url: `https://search.libretexts.org/?query=${q}`,
      descripcion: 'Textos abiertos',
      es_externo: true
    }
  ];
};

async function getAssignmentDetails(tarea_id) {
  try {
    const [[row]] = await pool.query(
      `SELECT t.id, t.titulo, t.descripcion,
              (SELECT te.nota FROM tareas_entregas te 
                WHERE te.tarea_id = t.id 
                ORDER BY te.id DESC LIMIT 1) AS nota
       FROM tareas t
       WHERE t.id = ? LIMIT 1`, 
      [tarea_id]
    );
    return row || null;
  } catch (error) {
    console.error('[ERROR] Error al obtener detalles de la tarea:', error.message);
    return null;
  }
}

async function searchResources(term) {
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, url, descripcion, false as es_externo
       FROM recursos
       WHERE (titulo LIKE CONCAT('%', ?, '%') OR descripcion LIKE CONCAT('%', ?, '%'))
       ORDER BY id DESC
       LIMIT 10`,
      [term, term]
    );
    return rows;
  } catch (error) {
    console.error('[WARN] Error al buscar recursos, usando alternativas:', error.message);
    return EXTERNAL_RESOURCES(term);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Endpoint de prueba
  if ('ping' in (req.query || {})) {
    return ok(res, { 
      ok: true, 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  try {
    // Obtener parámetros con soporte para snake_case y camelCase
    const tareaRaw = pickQuery(req, ['tarea_id', 'tareaId', 'id'], { 
      required: true, 
      nameForError: 'tarea_id|tareaId|id' 
    });
    
    const cursoRaw = pickQuery(req, ['curso_id', 'cursoId', 'curso'], { 
      required: true, 
      nameForError: 'curso_id|cursoId|curso' 
    });

    const tarea_id = toInt(tareaRaw, 'tarea_id');
    const curso_id = toInt(cursoRaw, 'curso_id');

    // Obtener detalles de la tarea
    const tarea = await getAssignmentDetails(tarea_id);
    
    if (!tarea) {
      return ok(res, { 
        tarea_id, 
        curso_id, 
        recursos: [], 
        motivo: 'tarea_no_encontrada',
        sugerencia: 'Verifica que el ID de la tarea sea correcto'
      });
    }

    const nota = Number.isFinite(tarea?.nota) ? Number(tarea.nota) : null;
    const baseTexto = `${tarea?.titulo || ''} ${tarea?.descripcion || ''}`.trim();
    const term = baseTexto.split(/\s+/).slice(0, 6).join(' ');

    // Buscar recursos solo si es necesario
    let recursos = [];
    if (nota === null || nota < 70) {
      recursos = await searchResources(term);
    }

    return ok(res, { 
      tarea_id, 
      curso_id, 
      nota,
      titulo: tarea.titulo,
      termino_busqueda: term,
      recursos,
      total_recursos: recursos.length,
      necesita_ayuda: nota === null || nota < 70
    });

  } catch (error) {
    console.error('[ERROR] Error en el endpoint de recomendaciones:', error);
    return fail(res, error);
  }
}
