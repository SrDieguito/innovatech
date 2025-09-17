// api/recomendaciones/index.js
import mysql from 'mysql2/promise';
import { topKeywords } from '../_utils/text.js';
import { khanSearchES } from '../_utils/khan.js';
import { getEstudianteId } from '../_utils/cookies.js';

// Recursos de respaldo cuando falla la búsqueda en Khan Academy
async function getFallbackResources(tema, keywords) {
  const baseResources = [
    {
      titulo: 'Recursos educativos abiertos',
      url: 'https://es.khanacademy.org/',
      snippet: 'Explora miles de recursos educativos gratuitos en Khan Academy',
      source: 'Sistema',
      score: 100
    },
    {
      titulo: 'Guías de estudio y ejercicios',
      url: 'https://es.khanacademy.org/math',
      snippet: 'Encuentra ejercicios y guías de estudio para practicar',
      source: 'Sistema',
      score: 90
    },
    {
      titulo: 'Videos educativos',
      url: 'https://es.khanacademy.org/science',
      snippet: 'Aprende con videos explicativos sobre diversos temas',
      source: 'Sistema',
      score: 80
    }
  ];

  // Si no hay tema, devolver recursos base
  if (!tema) {
    return baseResources;
  }

  // Si hay tema, devolver recursos específicos
  return [
    {
      titulo: `Búsqueda: ${tema}`,
      url: `https://es.khanacademy.org/search?referer=%2F&page_search_query=${encodeURIComponent(tema)}`,
      snippet: `Buscar recursos sobre "${tema}" en Khan Academy`,
      source: 'Sistema',
      score: 100
    },
    ...baseResources
  ];
}

const cfg = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || process.env.DB_DATABASE
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ ok:false, error:'Method not allowed' });

    const tareaId = Number(req.query.tareaId || req.query.tarea_id);
    const cursoId = Number(req.query.cursoId || req.query.curso_id) || null;
    const estudianteId = getEstudianteId(req); // opcional

    if (!tareaId) {
      return res.status(200).json({ ok:true, meta:{tareaId,cursoId}, items:[] });
    }

    const cn = await mysql.createConnection(cfg);

    // --- tarea + tema ---
    const [rows] = await cn.execute(`
      SELECT t.id, t.titulo, t.descripcion, t.tema_id, tm.nombre AS tema
      FROM tareas t
      LEFT JOIN temas tm ON tm.id = t.tema_id
      WHERE t.id = ? LIMIT 1
    `, [tareaId]);

    if (!rows?.length) {
      await cn.end();
      return res.status(200).json({ ok:true, meta:{tareaId,cursoId}, items:[] });
    }

    const tarea = rows[0];
    const baseText = `${tarea.tema || ''}. ${tarea.titulo || ''}. ${tarea.descripcion || ''}`.trim();
    const kws = topKeywords(baseText, 10);
    const query = (tarea.tema?.trim() ? tarea.tema : kws.slice(0,6).join(' ')) || (tarea.titulo||'').slice(0,120);

    // --- calificación del alumno (opcional) ---
    let calificacion = null;
    if (estudianteId) {
      const [ent] = await cn.execute(`
        SELECT calificacion
        FROM tareas_entregas
        WHERE tarea_id=? AND estudiante_id=?
        ORDER BY fecha_entrega DESC
        LIMIT 1
      `, [tareaId, estudianteId]);
      if (ent?.length) calificacion = ent[0].calificacion;
    }
    await cn.end();

    // --- búsqueda en Khan ES ---
    console.log('Iniciando búsqueda de recomendaciones...', {
      tareaId,
      cursoId,
      estudianteId,
      calificacion,
      tema: tarea.tema,
      query,
      keywords: kws
    });
    
    let items = [];
    let khanError = null;
    
    try {
      console.log('Llamando a khanSearchES...');
      items = await khanSearchES(query, kws);
      console.log(`Resultados de khanSearchES: ${items.length} items encontrados`);
      
      // --- personalización simple por nota ---
      if (calificacion != null && items.length > 0) {
        console.log('Aplicando personalización por calificación:', calificacion);
        const low = Number(calificacion) <= 70;
        items = items.map(it => {
          let bonus = 0;
          const t = `${it.titulo} ${it.snippet||''}`.toLowerCase();

          // si le fue bajo: premia intro/práctica; si alto: premia avanzado
          if (low) {
            if (/introducci|basi|fundament|práctica|practica|ejercic/.test(t)) bonus += 2.5;
            if (/video/.test(t)) bonus += 0.5;
          } else {
            if (/avanzad|profund|teor|demostraci/.test(t)) bonus += 2.0;
          }
          return { ...it, score: (it.score||0) + bonus };
        }).sort((a,b)=>b.score-a.score);
      }
    } catch (err) {
      console.error('Error in khanSearchES:', err);
      khanError = err.message;
    }
    
    // Si no hay resultados de Khan Academy o hubo un error, intentar con búsqueda directa
    if (items.length === 0 || khanError) {
      console.log('Usando búsqueda de respaldo para:', query);
      try {
        // Primero intentamos con una búsqueda directa en KA
        const kaUrl = `https://es.khanacademy.org/search?referer=%2F&page_search_query=${encodeURIComponent(query)}`;
        
        // Si hay un error específico de KA, intentamos una búsqueda más amplia
        const searchQuery = khanError?.includes('timeout') ? query : `site:es.khanacademy.org ${query}`;
        
        const kaResults = await khanSearchES(searchQuery, kws);
        
        if (kaResults.length > 0) {
          items = [
            {
              titulo: `Resultados de búsqueda para: ${query}`,
              url: kaUrl,
              snippet: `Resultados de búsqueda en Khan Academy para "${query}"`,
              source: 'Khan Academy',
              score: 100
            },
            ...kaResults.slice(0, 4).map(r => ({
              ...r,
              score: 90 - (items.indexOf(r) * 2) // Ajustar puntuación para mantener orden
            }))
          ];
        } else {
          // Si no hay resultados, proporcionar enlace directo a la búsqueda
          items = [
            {
              titulo: 'Buscar en Khan Academy',
              url: kaUrl,
              snippet: `No se encontraron resultados. Haz clic para buscar "${query}" directamente en Khan Academy`,
              source: 'Khan Academy',
              score: 100
            },
            ...(await getFallbackResources(tarea.tema || query, kws))
          ];
        }
      } catch (fallbackError) {
        console.error('Error en búsqueda de respaldo:', fallbackError);
        // Si todo falla, usar recursos locales
        items = await getFallbackResources(tarea.tema || query, kws);
      }
    }

    return res.status(200).json({
      ok: true,
      meta: { 
        tareaId, 
        cursoId, 
        query, 
        keywords: kws, 
        tema: tarea.tema || null, 
        estudianteId, 
        calificacion,
        khanError: khanError || undefined
      },
      items
    });
  } catch (err) {
    console.error('Error in /api/recomendaciones:', err);
    return res.status(200).json({ 
      ok: true, 
      meta: { 
        error: 'Error al obtener recomendaciones',
        internalError: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined
      }, 
      items: await getFallbackResources('', []) 
    });
  }
}
