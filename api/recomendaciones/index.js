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

// Basic Spanish → English term mapping for academic paper searches
const ES_EN = {
  // CS / programación
  algoritmo:'algorithm', algoritmos:'algorithms',
  ordenamiento:'sorting', ordenacion:'sorting',
  busqueda:'search', buscar:'search',
  implementacion:'implementation', implementar:'implementation',
  programacion:'programming', programa:'program',
  datos:'data', dato:'data',
  estructura:'structure', estructuras:'structures',
  complejidad:'complexity', eficiencia:'efficiency', rendimiento:'performance',
  recursion:'recursion', recursivo:'recursive', iteracion:'iteration', iterativo:'iterative',
  arbol:'tree', arboles:'trees', grafo:'graph', grafos:'graphs',
  pila:'stack', cola:'queue', lista:'list', enlazada:'linked',
  binario:'binary', burbuja:'bubble', rapido:'quick', insercion:'insertion', seleccion:'selection',
  hash:'hash', tabla:'table', montaculo:'heap', fusion:'merge',
  red:'network', redes:'networks', neuronal:'neural',
  inteligencia:'intelligence', artificial:'artificial', aprendizaje:'learning', maquina:'machine',
  base:'database', codigo:'code', codificacion:'coding',
  objeto:'object', objetos:'objects', clase:'class', clases:'classes',
  metodo:'method', metodos:'methods', funcion:'function', funciones:'functions',
  variable:'variable', variables:'variables', array:'array',
  // Math
  ecuacion:'equation', ecuaciones:'equations',
  derivada:'derivative', integral:'integral', limite:'limit',
  algebra:'algebra', calculo:'calculus', estadistica:'statistics',
  probabilidad:'probability', matriz:'matrix', matrices:'matrices',
  vector:'vector', geometria:'geometry', trigonometria:'trigonometry',
  numero:'number', fraccion:'fraction', polinomio:'polynomial',
  // Physics / Chemistry / Biology
  fisica:'physics', mecanica:'mechanics', termodinamica:'thermodynamics',
  energia:'energy', fuerza:'force', movimiento:'motion', onda:'wave',
  velocidad:'velocity', aceleracion:'acceleration', gravedad:'gravity',
  quimica:'chemistry', reaccion:'reaction', molecula:'molecule', atomo:'atom',
  biologia:'biology', celula:'cell', genetica:'genetics', evolucion:'evolution',
  ecosistema:'ecosystem', adn:'DNA', proteina:'protein',
  // General academic
  analisis:'analysis', sintesis:'synthesis', teoria:'theory', modelo:'model',
  metodo:'method', metodologia:'methodology',
  evaluacion:'evaluation', comparacion:'comparison',
  optimizacion:'optimization', aplicacion:'application', aplicaciones:'applications',
  sistema:'system', sistemas:'systems', introduccion:'introduction', conceptos:'concepts',
  estudio:'study', investigacion:'research', desarrollo:'development',
  // Filler words → strip
  de:'', la:'', el:'', los:'', las:'', un:'', una:'',
  y:'', o:'', en:'', con:'', por:'', para:'', del:'', al:'',
  mediante:'', utilizando:'', usando:'', basado:'', sobre:'', entre:'',
};

function traducirQuery(q) {
  const words = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/);
  const translated = words.map(w => (w in ES_EN ? ES_EN[w] : w)).filter(w => w.length > 1);
  // Only use translation if it changed something (otherwise input was likely already English)
  const result = translated.join(' ').trim();
  return result.length > 5 ? result : q;
}

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

function scholarFallback(query) {
  return {
    titulo: `Buscar en Google Scholar: "${query.slice(0, 50)}"`,
    url: `https://scholar.google.com/scholar?hl=es&q=${encodeURIComponent(query)}`,
    desc: 'Busca papers, tesis y publicaciones académicas en Google Scholar',
    tipo: 'busqueda',
    nivel: 'intermedio',
    fuente: 'scholar',
    legible: false,
  };
}

function scihubItem(query) {
  return {
    titulo: 'Sci-Hub — Artículos científicos gratuitos',
    url: `https://sci-hub.su/`,
    desc: `Busca "${query.slice(0, 60)}" por título o DOI. Más de 85 millones de papers disponibles.`,
    tipo: 'busqueda',
    nivel: 'avanzado',
    fuente: 'scihub',
    legible: false,
  };
}

// Reconstructs abstract from OpenAlex inverted index format
function _rebuildAbstract(inv) {
  if (!inv || typeof inv !== 'object') return null;
  const words = {};
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) words[pos] = word;
  }
  const keys = Object.keys(words).map(Number).sort((a, b) => a - b);
  return keys.length ? keys.map(k => words[k]).join(' ').trim() : null;
}

function _paperItem(titulo, url, abstract, authors, year, pdfUrl, doi, fuente) {
  const hasAbstract = !!(abstract && abstract.length > 50);
  const doiClean = (doi || '').replace('https://doi.org/', '').trim();
  return {
    titulo,
    url,
    desc: hasAbstract ? abstract.slice(0, 280) : 'Artículo académico',
    contenido: hasAbstract ? abstract : null,
    autores: authors || null,
    anio: year || null,
    pdf_url: pdfUrl || null,
    doi: doiClean || null,
    scihub_url: doiClean ? `https://sci-hub.su/${doiClean}` : null,
    tipo: 'paper',
    nivel: 'avanzado',
    fuente,
    legible: hasAbstract,
  };
}

async function _semanticScholar(q, offset = 0) {
  try {
    const params = new URLSearchParams({
      query: q,
      fields: 'title,abstract,authors,year,openAccessPdf,externalIds',
      limit: '5',
      offset: String(offset),
    });
    const r = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?${params}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.data || []).filter(p => p.title).slice(0, 4).map(p =>
      _paperItem(
        p.title,
        `https://www.semanticscholar.org/paper/${p.paperId}`,
        p.abstract || null,
        (p.authors || []).slice(0, 3).map(a => a.name).join(', '),
        p.year,
        p.openAccessPdf?.url || null,
        p.externalIds?.DOI || null,
        'semanticscholar'
      )
    );
  } catch { return []; }
}

async function _openAlex(q, page = 1) {
  try {
    const params = new URLSearchParams({
      search: q,
      'per-page': '5',
      page: String(page),
      select: 'id,title,abstract_inverted_index,authorships,publication_year,open_access,doi',
    });
    const r = await fetch(`https://api.openalex.org/works?${params}`, {
      headers: { 'User-Agent': 'InnovaTech LMS (contact@innovatech.edu)' },
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results || []).filter(p => p.title).slice(0, 4).map(p => {
      const abstract = _rebuildAbstract(p.abstract_inverted_index);
      const authors = (p.authorships || []).slice(0, 3).map(a => a.author?.display_name).filter(Boolean).join(', ');
      const doiRaw = (p.doi || '').replace('https://doi.org/', '').trim();
      const oaUrl = p.open_access?.oa_url || null;
      const id = (p.id || '').replace('https://openalex.org/', '');
      return _paperItem(
        p.title,
        oaUrl || (doiRaw ? `https://doi.org/${doiRaw}` : `https://openalex.org/${id}`),
        abstract,
        authors,
        p.publication_year,
        oaUrl || null,
        doiRaw || null,
        'semanticscholar'
      );
    });
  } catch { return []; }
}

// Runs both APIs in parallel, prefers readable papers, deduplicates by title
async function buscarSemanticScholar(query, page = 0) {
  const qEs = query.normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 200);
  const qEn = traducirQuery(query).slice(0, 200);  // English for SS (primarily English DB)
  const [ssRes, oaRes] = await Promise.allSettled([
    _semanticScholar(qEn, page * 5),   // Semantic Scholar: English query
    _openAlex(qEs, page + 1),          // OpenAlex: Spanish query (multilingual)
  ]);
  const ss = ssRes.status === 'fulfilled' ? ssRes.value : [];
  const oa = oaRes.status === 'fulfilled' ? oaRes.value : [];
  const seen = new Set();
  return [...ss, ...oa]
    .sort((a, b) => (b.legible ? 1 : 0) - (a.legible ? 1 : 0))
    .filter(p => {
      const key = p.titulo.toLowerCase().replace(/\s+/g, ' ').slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
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

    // Strip common metadata prefixes teachers accidentally include in titles
    // e.g. "Título: Foo" → "Foo", "Tarea 3: Foo" → "Foo"
    const tituloLimpio = titulo
      .replace(/^(título|titulo|tarea|actividad|ejercicio|práctica|practica|trabajo|clase|examen|quiz|tema|unidad|módulo|modulo|lectura|proyecto|práctica)\s*\d*\s*[:.\-–—]\s*/gi, '')
      .trim();

    const texto = `${tituloLimpio} ${descripcion}`.trim();
    const materia = detectarMateria(texto);
    const curados = materia ? CURADO[materia].items : GENERAL;

    // Build a meaningful search topic:
    // If the cleaned title is generic ("tarea 1", "actividad 3") use the description instead
    const esGenerico = /^(tarea|actividad|ejercicio|practica|trabajo|clase|examen|quiz)\s*\d*$/i.test(tituloLimpio.trim());
    const primeraLineaDesc = (descripcion || '').split('\n')[0].trim().slice(0, 120);
    const topico = !esGenerico && tituloLimpio.length > 5
      ? tituloLimpio
      : (primeraLineaDesc.length > 8 ? primeraLineaDesc : texto.slice(0, 100));

    // Wikipedia / academic search
    const searchQuery = topico || 'educacion';

    const page = Math.max(0, parseInt(req.query.page) || 0);

    // Extract specific technical terms already in English from the description
    // e.g. "Bubble Sort, Quick Sort y Binary Search" → "Bubble Sort Quick Sort Binary Search"
    const terminosTec = ((descripcion || '').match(/[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})+/g) || [])
      .filter((t, i, a) => a.indexOf(t) === i)
      .slice(0, 5)
      .join(' ');

    // For academic papers: title keywords + specific technical terms from description
    // This is much more precise than the title alone
    const queryPapers = [topico, terminosTec].filter(Boolean).join(' ').slice(0, 250);

    // YouTube: subject + exact topic (no extra words that dilute results)
    const nombreMateria = {
      matematicas: 'matemáticas', fisica: 'física', quimica: 'química',
      biologia: 'biología', programacion: 'programación', ingles: 'inglés',
      historia: 'historia', economia: 'economía', literatura: 'lengua y literatura',
    }[materia] || '';
    const ytQuery = nombreMateria ? `${nombreMateria} ${topico}` : topico;

    let items;

    if (page > 0) {
      // queryPapers (title + extracted tech terms) is very specific and has few results
      // beyond offset 5. For load-more, use the broader topico query so there are
      // always more pages available. Frontend deduplicates by URL.
      const [r1, r2] = await Promise.allSettled([
        buscarSemanticScholar(topico, page),      // broader query — more depth
        buscarSemanticScholar(queryPapers, page), // specific — contributes if available
      ]);
      const a1 = r1.status === 'fulfilled' ? r1.value : [];
      const a2 = r2.status === 'fulfilled' ? r2.value : [];
      const seen = new Set();
      items = [...a1, ...a2]
        .filter(p => {
          if (seen.has(p.url)) return false;
          seen.add(p.url);
          return true;
        })
        .slice(0, 8);
    } else {
      const [wiki, papers, videos] = await Promise.all([
        buscarWikipedia(searchQuery),
        buscarSemanticScholar(queryPapers, 0),
        process.env.YOUTUBE_API_KEY ? buscarYouTube(ytQuery) : Promise.resolve([]),
      ]);
      items = [
        ...videos,
        ...wiki,
        ...papers,
        scholarFallback(topico),
        scihubItem(topico),
        ...curados,
      ];
    }

    return res.json({
      ok: true,
      materia: materia || 'general',
      tarea: { titulo, descripcion: descripcion.slice(0, 300) },
      items,
      page,
    });
  } catch (err) {
    console.error('Error /api/recomendaciones:', err);
    return res.json({ ok: true, materia: 'general', tarea: {}, items: GENERAL });
  }
}
