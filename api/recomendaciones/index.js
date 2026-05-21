import { pool } from '../db.js';

const CURADO = {
  matematicas: {
    kw: ['matemat', 'algebra', 'calculo', 'geometr', 'estadist', 'trigonometr', 'aritmet', 'ecuacion', 'funcion', 'derivada', 'integral', 'numero', 'fraccion', 'polinomio', 'limite', 'vector', 'matriz'],
    items: [
      { titulo: 'Khan Academy - Matemáticas', url: 'https://es.khanacademy.org/math', desc: 'Ejercicios interactivos para todos los niveles', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Álgebra', url: 'https://es.khanacademy.org/math/algebra', desc: 'Ecuaciones, funciones y gráficas con corrección automática', tipo: 'ejercicios', nivel: 'basico', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Cálculo', url: 'https://es.khanacademy.org/math/calculus-1', desc: 'Límites, derivadas e integrales paso a paso', tipo: 'ejercicios', nivel: 'avanzado', fuente: 'khanacademy' },
      { titulo: 'GeoGebra - Calculadora gráfica', url: 'https://www.geogebra.org/graphing', desc: 'Grafica funciones y resuelve ecuaciones visualmente', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/', desc: 'Resuelve cualquier problema matemático mostrando los pasos', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
    ],
  },
  fisica: {
    kw: ['fisic', 'mecanic', 'termodinam', 'optic', 'cinematica', 'fuerza', 'energia', 'movimiento', 'onda', 'electromagnetis', 'velocidad', 'aceleracion', 'gravedad', 'presion', 'calor'],
    items: [
      { titulo: 'Khan Academy - Física', url: 'https://es.khanacademy.org/science/physics', desc: 'Videos y ejercicios de física básica y universitaria', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'PhET Simulaciones', url: 'https://phet.colorado.edu/es/simulations/category/physics', desc: 'Laboratorios virtuales interactivos de la Universidad de Colorado', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Fisicalab', url: 'https://www.fisicalab.com/', desc: 'Teoría, fórmulas y ejercicios organizados por tema', tipo: 'articulo', nivel: 'basico', fuente: 'academico' },
    ],
  },
  quimica: {
    kw: ['quimic', 'organic', 'inorganic', 'reaccion', 'molecul', 'atomo', 'acido', 'periodico', 'estequiometr', 'enlace', 'compuesto', 'elemento', 'base', 'oxidacion'],
    items: [
      { titulo: 'Khan Academy - Química', url: 'https://es.khanacademy.org/science/chemistry', desc: 'Química general, orgánica e inorgánica con ejercicios', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'PhET - Química', url: 'https://phet.colorado.edu/es/simulations/category/chemistry', desc: 'Simulaciones de reacciones y ácidos', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Ptable - Tabla periódica', url: 'https://ptable.com/?lang=es', desc: 'Propiedades completas de todos los elementos', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
    ],
  },
  biologia: {
    kw: ['biolog', 'celula', 'genetic', 'anatom', 'ecolog', 'evolucion', 'adn', 'proteina', 'fotosintesis', 'organismo', 'especie', 'ecosistema', 'mitosis', 'meiosis'],
    items: [
      { titulo: 'Khan Academy - Biología', url: 'https://es.khanacademy.org/science/biology', desc: 'Biología celular, genética, evolución y ecología', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Genética', url: 'https://es.khanacademy.org/science/biology/classical-genetics', desc: 'Genética clásica y herencia', tipo: 'ejercicios', nivel: 'intermedio', fuente: 'khanacademy' },
      { titulo: 'HHMI BioInteractive', url: 'https://www.biointeractive.org/', desc: 'Videos y actividades interactivas de biología', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
    ],
  },
  programacion: {
    kw: ['program', 'codigo', 'software', 'algoritm', 'javascript', 'python', 'java', 'html', 'css', 'web', 'app', 'inform', 'computacion', 'sql', 'base de dato', 'tecnolog', 'desarrollo', 'variable', 'funcion', 'bucle', 'array', 'clase', 'objeto', 'api', 'framework'],
    items: [
      { titulo: 'Khan Academy - Informática', url: 'https://es.khanacademy.org/computing', desc: 'Programación y algoritmos para principiantes', tipo: 'ejercicios', nivel: 'basico', fuente: 'khanacademy' },
      { titulo: 'freeCodeCamp en español', url: 'https://www.freecodecamp.org/espanol/', desc: 'HTML, CSS, JavaScript con proyectos reales — gratis', tipo: 'curso', nivel: 'basico', fuente: 'academico' },
      { titulo: 'MDN Web Docs', url: 'https://developer.mozilla.org/es/', desc: 'Documentación oficial de tecnologías web en español', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
      { titulo: 'CS50 de Harvard', url: 'https://cs50.harvard.edu/x/', desc: 'El mejor curso de ciencias de la computación del mundo, gratis', tipo: 'curso', nivel: 'intermedio', fuente: 'academico' },
    ],
  },
  ingles: {
    kw: ['ingles', 'english', 'grammar', 'writing', 'reading', 'idioma', 'pronunciacion', 'vocabular', 'speaking', 'listening', 'tense', 'verb'],
    items: [
      { titulo: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', desc: 'Gramática, vocabulario y pronunciación de la BBC', tipo: 'curso', nivel: 'todos', fuente: 'academico' },
      { titulo: 'British Council - LearnEnglish', url: 'https://learnenglish.britishcouncil.org/', desc: 'Recursos oficiales para aprender inglés', tipo: 'curso', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Khan Academy - Lectura en inglés', url: 'https://www.khanacademy.org/test-prep/sat', desc: 'Lectura, escritura y gramática en inglés', tipo: 'ejercicios', nivel: 'intermedio', fuente: 'khanacademy' },
    ],
  },
  historia: {
    kw: ['histor', 'social', 'geograf', 'cultur', 'civilizacion', 'guerra', 'politica', 'republica', 'independencia', 'revolucion', 'colonizacion', 'edad media', 'imperio'],
    items: [
      { titulo: 'Khan Academy - Historia del mundo', url: 'https://es.khanacademy.org/humanities/world-history', desc: 'Historia mundial desde la prehistoria hasta hoy', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'National Geographic Education', url: 'https://education.nationalgeographic.org/', desc: 'Geografía, historia y ciencias naturales', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
    ],
  },
  economia: {
    kw: ['econom', 'finanz', 'contabil', 'administr', 'mercado', 'negoci', 'presupuesto', 'microeconom', 'macroeconom', 'oferta', 'demanda', 'empresa', 'precio', 'inflacion', 'pib'],
    items: [
      { titulo: 'Khan Academy - Microeconomía', url: 'https://es.khanacademy.org/economics-finance-domain/microeconomics', desc: 'Oferta, demanda, mercados y decisiones económicas', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Macroeconomía', url: 'https://es.khanacademy.org/economics-finance-domain/macroeconomics', desc: 'PIB, inflación, política monetaria y fiscal', tipo: 'ejercicios', nivel: 'intermedio', fuente: 'khanacademy' },
      { titulo: 'Investopedia', url: 'https://www.investopedia.com/', desc: 'Conceptos financieros y económicos explicados claramente', tipo: 'articulo', nivel: 'intermedio', fuente: 'academico' },
    ],
  },
  literatura: {
    kw: ['literatur', 'redaccion', 'escritura', 'lectura', 'lenguaje', 'ortografi', 'gramatic', 'espanol', 'lengua', 'ensayo', 'novela', 'poesia', 'narrativa', 'texto'],
    items: [
      { titulo: 'Khan Academy - Lectura y Escritura', url: 'https://es.khanacademy.org/ela', desc: 'Gramática, comprensión lectora y composición escrita', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'RAE - Recursos', url: 'https://www.rae.es/recursos', desc: 'Diccionario oficial, gramática y ortografía española', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Cervantes Virtual', url: 'https://www.cervantesvirtual.com/', desc: 'Biblioteca digital con miles de obras en español', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
    ],
  },
};

const GENERAL = [
  { titulo: 'Khan Academy en español', url: 'https://es.khanacademy.org/', desc: 'Matemáticas, ciencias, historia, economía — todo gratis', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
  { titulo: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/', desc: 'Materiales reales de cursos del MIT, gratis', tipo: 'curso', nivel: 'avanzado', fuente: 'academico' },
  { titulo: 'Coursera - Auditar cursos gratis', url: 'https://www.coursera.org/', desc: 'Cursos de universidades del mundo, muchos auditables gratis', tipo: 'curso', nivel: 'intermedio', fuente: 'academico' },
];

function detectarMateria(texto) {
  const txt = (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [materia, cfg] of Object.entries(CURADO)) {
    if (cfg.kw.some(kw => txt.includes(kw))) return materia;
  }
  return null;
}

async function buscarWikipedia(query) {
  try {
    const q = encodeURIComponent(query.slice(0, 120));
    const url = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&srlimit=3&origin=*`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.query?.search || []).slice(0, 3).map(item => ({
      titulo: item.title,
      url: `https://es.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      desc: (item.snippet || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim().slice(0, 180),
      tipo: 'articulo',
      nivel: 'todos',
      fuente: 'wikipedia',
      legible: true,
    }));
  } catch { return []; }
}

function scholarItem(query) {
  return {
    titulo: `Artículos académicos: "${query.slice(0, 55)}"`,
    url: `https://scholar.google.com/scholar?hl=es&q=${encodeURIComponent(query)}`,
    desc: 'Busca papers, tesis y publicaciones científicas relacionadas con este tema en Google Scholar',
    tipo: 'busqueda',
    nivel: 'intermedio',
    fuente: 'scholar',
  };
}

async function buscarYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query.slice(0, 200),
      type: 'video',
      maxResults: '4',
      relevanceLanguage: 'es',
      safeSearch: 'strict',
      videoDuration: 'medium',   // excluye Shorts (< 4 min)
      key: apiKey,
    });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.items || []).map(item => ({
      titulo: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      desc: (item.snippet.description || item.snippet.channelTitle || '').slice(0, 160),
      canal: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || null,
      tipo: 'video',
      nivel: 'todos',
      fuente: 'youtube',
    }));
  } catch { return []; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const tareaId = req.query.tarea_id;
    let titulo = String(req.query.titulo || '');
    let descripcion = String(req.query.descripcion || '');

    // Prefer DB lookup when tarea_id is provided
    if (tareaId) {
      try {
        const [rows] = await pool.query(
          'SELECT titulo, descripcion FROM tareas WHERE id = ?',
          [tareaId]
        );
        if (rows[0]) {
          titulo = rows[0].titulo || titulo;
          descripcion = rows[0].descripcion || descripcion;
        }
      } catch { /* fallback to params */ }
    }

    const texto = `${titulo} ${descripcion}`.trim();
    const materia = detectarMateria(texto);
    const curados = materia ? CURADO[materia].items : GENERAL;

    // Build a meaningful search topic:
    // If the title is generic ("tarea 1", "actividad 3", etc.) use the description instead
    const esGenerico = /^(tarea|actividad|ejercicio|practica|trabajo|clase|examen|quiz)\s*\d*$/i.test(titulo.trim());
    const primeraLineaDesc = (descripcion || '').split('\n')[0].trim().slice(0, 120);
    const topico = !esGenerico && titulo.length > 5
      ? titulo
      : (primeraLineaDesc.length > 8 ? primeraLineaDesc : texto.slice(0, 100));

    // Wikipedia: search the real topic
    const searchQuery = topico || 'educacion';

    // YouTube: add materia as context anchor + use "explicación" (not "tutorial")
    const nombreMateria = {
      matematicas: 'matemáticas', fisica: 'física', quimica: 'química',
      biologia: 'biología', programacion: 'programación', ingles: 'inglés',
      historia: 'historia', economia: 'economía', literatura: 'lengua y literatura',
    }[materia] || '';
    const ytQuery = `${nombreMateria} ${topico} explicación`.trim();

    const [wiki, videos] = await Promise.all([
      buscarWikipedia(searchQuery),
      process.env.YOUTUBE_API_KEY
        ? buscarYouTube(ytQuery)
        : Promise.resolve([]),
    ]);

    const items = [
      ...videos,
      ...wiki,
      scholarItem(topico),
      ...curados,
    ];

    return res.json({
      ok: true,
      materia: materia || 'general',
      tarea: { titulo, descripcion: descripcion.slice(0, 300) },
      items,
    });
  } catch (err) {
    console.error('Error /api/recomendaciones:', err);
    return res.json({ ok: true, materia: 'general', tarea: {}, items: GENERAL });
  }
}
