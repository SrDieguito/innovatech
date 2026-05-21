import { buscarVideosYouTube } from '../_utils/youtube.js';

// Curated fallback map — used when no YOUTUBE_API_KEY is set
const FALLBACK = {
  matematicas: {
    kw: ['matemat', 'algebra', 'calculo', 'geometr', 'estadist', 'trigonometr', 'aritmet', 'ecuacion', 'funcion', 'derivada', 'integral'],
    items: [
      { titulo: 'Khan Academy - Matemáticas', url: 'https://es.khanacademy.org/math', desc: 'Ejercicios y videos para todos los niveles', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'GeoGebra - Calculadora gráfica', url: 'https://www.geogebra.org/graphing', desc: 'Grafica funciones y resuelve ecuaciones visualmente', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/', desc: 'Resuelve cualquier problema matemático con pasos', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Desmos - Calculadora', url: 'https://www.desmos.com/calculator', desc: 'Calculadora gráfica online gratuita', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Matemáticas con Paco (YouTube)', url: 'https://www.youtube.com/@MatemáticasconPaco', desc: 'Videos paso a paso en español', tipo: 'video', nivel: 'basico' },
    ],
  },
  fisica: {
    kw: ['fisic', 'mecanic', 'termodinam', 'optic', 'cinematica', 'fuerza', 'energia', 'movimiento', 'onda'],
    items: [
      { titulo: 'Khan Academy - Física', url: 'https://es.khanacademy.org/science/physics', desc: 'Videos y ejercicios de física', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'PhET Simulaciones', url: 'https://phet.colorado.edu/es/', desc: 'Laboratorios virtuales de física', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Fisicalab', url: 'https://www.fisicalab.com/', desc: 'Teoría y ejercicios en español', tipo: 'articulo', nivel: 'basico' },
    ],
  },
  quimica: {
    kw: ['quimic', 'organic', 'inorganic', 'reaccion', 'molecul', 'atomo', 'acido', 'periodico'],
    items: [
      { titulo: 'Khan Academy - Química', url: 'https://es.khanacademy.org/science/chemistry', desc: 'Química general, orgánica e inorgánica', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'PhET - Química', url: 'https://phet.colorado.edu/es/simulations/category/chemistry', desc: 'Laboratorios virtuales de química', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Ptable - Tabla periódica', url: 'https://ptable.com/?lang=es', desc: 'Tabla periódica interactiva', tipo: 'herramienta', nivel: 'todos' },
    ],
  },
  biologia: {
    kw: ['biolog', 'celula', 'genetic', 'anatom', 'ecolog', 'evolucion', 'adn', 'proteina', 'fotosintesis'],
    items: [
      { titulo: 'Khan Academy - Biología', url: 'https://es.khanacademy.org/science/biology', desc: 'Biología celular, genética y ecología', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'HHMI BioInteractive', url: 'https://www.biointeractive.org/', desc: 'Recursos de biología con videos y actividades', tipo: 'herramienta', nivel: 'todos' },
    ],
  },
  programacion: {
    kw: ['program', 'codigo', 'software', 'algoritm', 'javascript', 'python', 'java', 'html', 'css', 'web', 'app', 'inform', 'computacion', 'sql', 'base de dato', 'tecnolog'],
    items: [
      { titulo: 'freeCodeCamp en español', url: 'https://www.freecodecamp.org/espanol/', desc: 'HTML, CSS, JavaScript con proyectos reales — gratis', tipo: 'curso', nivel: 'basico' },
      { titulo: 'MDN Web Docs', url: 'https://developer.mozilla.org/es/', desc: 'Documentación oficial web en español', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'CS50 de Harvard', url: 'https://cs50.harvard.edu/x/', desc: 'El mejor curso de ciencias de la computación, gratis', tipo: 'curso', nivel: 'intermedio' },
      { titulo: 'Codecademy', url: 'https://www.codecademy.com/', desc: 'Ejercicios interactivos de programación', tipo: 'ejercicios', nivel: 'basico' },
    ],
  },
  ingles: {
    kw: ['ingles', 'english', 'grammar', 'writing', 'reading', 'idioma', 'pronunciacion'],
    items: [
      { titulo: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', desc: 'Gramática, vocabulario y pronunciación', tipo: 'curso', nivel: 'todos' },
      { titulo: 'Duolingo - Inglés', url: 'https://www.duolingo.com/', desc: 'Aprende inglés con lecciones diarias', tipo: 'ejercicios', nivel: 'basico' },
    ],
  },
  historia: {
    kw: ['histor', 'social', 'geograf', 'cultur', 'civilizacion', 'guerra', 'politica', 'republica'],
    items: [
      { titulo: 'Khan Academy - Historia', url: 'https://es.khanacademy.org/humanities/world-history', desc: 'Historia mundial con videos', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'National Geographic Education', url: 'https://education.nationalgeographic.org/', desc: 'Geografía, historia y ciencias naturales', tipo: 'articulo', nivel: 'todos' },
    ],
  },
  economia: {
    kw: ['econom', 'finanz', 'contabil', 'administr', 'mercado', 'negoci', 'presupuesto'],
    items: [
      { titulo: 'Khan Academy - Economía', url: 'https://es.khanacademy.org/economics-finance-domain', desc: 'Microeconomía, macroeconomía y finanzas', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'Investopedia', url: 'https://www.investopedia.com/', desc: 'Conceptos financieros y económicos', tipo: 'articulo', nivel: 'intermedio' },
    ],
  },
  literatura: {
    kw: ['literatur', 'redaccion', 'escritura', 'lectura', 'lenguaje', 'ortografi', 'gramatic', 'espanol', 'lengua'],
    items: [
      { titulo: 'RAE - Recursos de lengua española', url: 'https://www.rae.es/recursos', desc: 'Diccionario, gramática y ortografía oficiales', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'Cervantes Virtual', url: 'https://www.cervantesvirtual.com/', desc: 'Biblioteca digital de obras literarias en español', tipo: 'articulo', nivel: 'todos' },
    ],
  },
};

const FALLBACK_GENERAL = [
  { titulo: 'Khan Academy en español', url: 'https://es.khanacademy.org/', desc: 'Ejercicios y videos educativos gratuitos en español', tipo: 'ejercicios', nivel: 'todos' },
  { titulo: 'Coursera - Cursos gratuitos', url: 'https://www.coursera.org/', desc: 'Cursos de universidades del mundo, muchos auditables gratis', tipo: 'curso', nivel: 'intermedio' },
  { titulo: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/', desc: 'Materiales de cursos del MIT completamente gratis', tipo: 'curso', nivel: 'avanzado' },
  { titulo: 'YouTube Edu', url: 'https://www.youtube.com/education', desc: 'Videos educativos verificados en todas las materias', tipo: 'video', nivel: 'todos' },
];

function detectarMateria(texto) {
  const txt = (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [materia, cfg] of Object.entries(FALLBACK)) {
    if (cfg.kw.some(kw => txt.includes(kw))) return materia;
  }
  return null;
}

function construirQuery(nombre, tareas, promedio) {
  // Build a targeted YouTube search query
  const base = nombre || '';
  // Take keywords from the first 3 task titles
  const tareasTexto = (tareas || []).slice(0, 3).join(' ');
  const sufijo = promedio != null && promedio < 5
    ? 'explicación básica para principiantes'
    : 'tutorial explicación';
  return `${base} ${tareasTexto} ${sufijo}`.replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const nombre    = String(req.query.nombre || '');
    const promedio  = req.query.promedio !== '' && req.query.promedio != null
      ? parseFloat(req.query.promedio) : null;
    // Array of task titles sent from frontend: ?tareas=titulo1&tareas=titulo2
    const tareas = req.query.tareas
      ? (Array.isArray(req.query.tareas) ? req.query.tareas : [req.query.tareas])
      : [];

    // 1. Try YouTube API (requires YOUTUBE_API_KEY in .env)
    if (process.env.YOUTUBE_API_KEY) {
      const query = construirQuery(nombre, tareas, promedio);
      const videos = await buscarVideosYouTube(query, 6);
      if (videos?.length) {
        return res.json({ ok: true, fuente: 'youtube', materia: detectarMateria(nombre) || 'general', items: videos });
      }
    }

    // 2. Fallback: curated map
    const materia = detectarMateria(`${nombre} ${tareas.join(' ')}`);
    const items = materia ? FALLBACK[materia].items : FALLBACK_GENERAL;
    return res.json({ ok: true, fuente: 'curado', materia: materia || 'general', items });

  } catch (err) {
    console.error('Error /api/recomendaciones:', err);
    return res.json({ ok: true, fuente: 'curado', materia: 'general', items: FALLBACK_GENERAL });
  }
}
