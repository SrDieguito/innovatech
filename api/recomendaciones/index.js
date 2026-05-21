import { buscarVideosYouTube } from '../_utils/youtube.js';

// Each item has: titulo, url, desc, tipo, nivel, fuente ('khanacademy'|'academico')
const CURADO = {
  matematicas: {
    kw: ['matemat', 'algebra', 'calculo', 'geometr', 'estadist', 'trigonometr', 'aritmet', 'ecuacion', 'funcion', 'derivada', 'integral'],
    items: [
      { titulo: 'Khan Academy - Matemáticas', url: 'https://es.khanacademy.org/math', desc: 'Ejercicios interactivos y videos para todos los niveles de matemáticas', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Álgebra', url: 'https://es.khanacademy.org/math/algebra', desc: 'Ecuaciones, funciones y gráficas — ejercicios con corrección automática', tipo: 'ejercicios', nivel: 'basico', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Cálculo', url: 'https://es.khanacademy.org/math/calculus-1', desc: 'Límites, derivadas e integrales paso a paso', tipo: 'ejercicios', nivel: 'avanzado', fuente: 'khanacademy' },
      { titulo: 'GeoGebra - Calculadora gráfica', url: 'https://www.geogebra.org/graphing', desc: 'Grafica funciones y resuelve ecuaciones visualmente', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/', desc: 'Resuelve cualquier problema matemático mostrando los pasos', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Desmos - Calculadora', url: 'https://www.desmos.com/calculator', desc: 'Calculadora gráfica interactiva gratuita', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'MIT OpenCourseWare - Matemáticas', url: 'https://ocw.mit.edu/courses/mathematics/', desc: 'Cursos universitarios del MIT, completamente gratis', tipo: 'curso', nivel: 'avanzado', fuente: 'academico' },
    ],
  },
  fisica: {
    kw: ['fisic', 'mecanic', 'termodinam', 'optic', 'cinematica', 'fuerza', 'energia', 'movimiento', 'onda', 'electromagnetis'],
    items: [
      { titulo: 'Khan Academy - Física', url: 'https://es.khanacademy.org/science/physics', desc: 'Videos y ejercicios de física básica y universitaria', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Mecánica', url: 'https://es.khanacademy.org/science/physics/work-energy-power', desc: 'Trabajo, energía, potencia y movimiento', tipo: 'ejercicios', nivel: 'basico', fuente: 'khanacademy' },
      { titulo: 'PhET Simulaciones de Física', url: 'https://phet.colorado.edu/es/simulations/category/physics', desc: 'Laboratorios virtuales interactivos de la Universidad de Colorado', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Fisicalab - Física en español', url: 'https://www.fisicalab.com/', desc: 'Teoría, fórmulas y ejercicios organizados por tema', tipo: 'articulo', nivel: 'basico', fuente: 'academico' },
      { titulo: 'MIT OCW - Physics', url: 'https://ocw.mit.edu/courses/physics/', desc: 'Cursos completos de física del MIT con videos y problemas', tipo: 'curso', nivel: 'avanzado', fuente: 'academico' },
    ],
  },
  quimica: {
    kw: ['quimic', 'organic', 'inorganic', 'reaccion', 'molecul', 'atomo', 'acido', 'periodico', 'estequiometr'],
    items: [
      { titulo: 'Khan Academy - Química', url: 'https://es.khanacademy.org/science/chemistry', desc: 'Química general, orgánica e inorgánica con ejercicios', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'PhET - Simulaciones de Química', url: 'https://phet.colorado.edu/es/simulations/category/chemistry', desc: 'Laboratorios virtuales: reacciones, ácidos y equilibrios', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Ptable - Tabla periódica interactiva', url: 'https://ptable.com/?lang=es', desc: 'Propiedades completas de todos los elementos', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'LibreTexts - Química', url: 'https://chem.libretexts.org/', desc: 'Libros de texto de química de acceso libre', tipo: 'articulo', nivel: 'intermedio', fuente: 'academico' },
    ],
  },
  biologia: {
    kw: ['biolog', 'celula', 'genetic', 'anatom', 'ecolog', 'evolucion', 'adn', 'proteina', 'fotosintesis'],
    items: [
      { titulo: 'Khan Academy - Biología', url: 'https://es.khanacademy.org/science/biology', desc: 'Biología celular, genética, evolución y ecología', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Genética', url: 'https://es.khanacademy.org/science/biology/classical-genetics', desc: 'Genética clásica y herencia', tipo: 'ejercicios', nivel: 'intermedio', fuente: 'khanacademy' },
      { titulo: 'HHMI BioInteractive', url: 'https://www.biointeractive.org/', desc: 'Videos, animaciones y actividades de biología', tipo: 'herramienta', nivel: 'todos', fuente: 'academico' },
      { titulo: 'LibreTexts - Biología', url: 'https://bio.libretexts.org/', desc: 'Libros de texto de biología de acceso libre', tipo: 'articulo', nivel: 'intermedio', fuente: 'academico' },
    ],
  },
  programacion: {
    kw: ['program', 'codigo', 'software', 'algoritm', 'javascript', 'python', 'java', 'html', 'css', 'web', 'app', 'inform', 'computacion', 'sql', 'base de dato', 'tecnolog', 'desarrollo'],
    items: [
      { titulo: 'Khan Academy - Informática', url: 'https://es.khanacademy.org/computing', desc: 'Programación, algoritmos y ciencias de la computación', tipo: 'ejercicios', nivel: 'basico', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - HTML/CSS', url: 'https://es.khanacademy.org/computing/computer-programming/html-css', desc: 'Aprende a crear páginas web desde cero', tipo: 'ejercicios', nivel: 'basico', fuente: 'khanacademy' },
      { titulo: 'freeCodeCamp en español', url: 'https://www.freecodecamp.org/espanol/', desc: 'HTML, CSS, JavaScript con proyectos reales — gratis', tipo: 'curso', nivel: 'basico', fuente: 'academico' },
      { titulo: 'MDN Web Docs', url: 'https://developer.mozilla.org/es/', desc: 'Documentación oficial de tecnologías web en español', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
      { titulo: 'CS50 de Harvard', url: 'https://cs50.harvard.edu/x/', desc: 'El mejor curso de ciencias de la computación del mundo, gratis', tipo: 'curso', nivel: 'intermedio', fuente: 'academico' },
      { titulo: 'Codecademy', url: 'https://www.codecademy.com/', desc: 'Ejercicios interactivos de Python, SQL, Web y más', tipo: 'ejercicios', nivel: 'basico', fuente: 'academico' },
    ],
  },
  ingles: {
    kw: ['ingles', 'english', 'grammar', 'writing', 'reading', 'idioma', 'pronunciacion', 'vocabular'],
    items: [
      { titulo: 'Khan Academy - Preparación SAT (inglés)', url: 'https://www.khanacademy.org/test-prep/sat', desc: 'Lectura, escritura y gramática en inglés con práctica real', tipo: 'ejercicios', nivel: 'intermedio', fuente: 'khanacademy' },
      { titulo: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', desc: 'Gramática, vocabulario y pronunciación de la BBC', tipo: 'curso', nivel: 'todos', fuente: 'academico' },
      { titulo: 'British Council - LearnEnglish', url: 'https://learnenglish.britishcouncil.org/', desc: 'Recursos oficiales del British Council para aprender inglés', tipo: 'curso', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Duolingo - Inglés', url: 'https://www.duolingo.com/', desc: 'Lecciones diarias gamificadas, gratis', tipo: 'ejercicios', nivel: 'basico', fuente: 'academico' },
    ],
  },
  historia: {
    kw: ['histor', 'social', 'geograf', 'cultur', 'civilizacion', 'guerra', 'politica', 'republica', 'independencia'],
    items: [
      { titulo: 'Khan Academy - Historia del mundo', url: 'https://es.khanacademy.org/humanities/world-history', desc: 'Historia mundial desde la prehistoria hasta hoy', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Historia de EE.UU.', url: 'https://es.khanacademy.org/humanities/us-history', desc: 'Historia moderna con contexto global', tipo: 'ejercicios', nivel: 'intermedio', fuente: 'khanacademy' },
      { titulo: 'National Geographic Education', url: 'https://education.nationalgeographic.org/', desc: 'Geografía, historia y ciencias naturales', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
    ],
  },
  economia: {
    kw: ['econom', 'finanz', 'contabil', 'administr', 'mercado', 'negoci', 'presupuesto', 'microeconom', 'macroeconom'],
    items: [
      { titulo: 'Khan Academy - Microeconomía', url: 'https://es.khanacademy.org/economics-finance-domain/microeconomics', desc: 'Oferta, demanda, mercados y decisiones económicas', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Macroeconomía', url: 'https://es.khanacademy.org/economics-finance-domain/macroeconomics', desc: 'PIB, inflación, política monetaria y fiscal', tipo: 'ejercicios', nivel: 'intermedio', fuente: 'khanacademy' },
      { titulo: 'Khan Academy - Finanzas personales', url: 'https://es.khanacademy.org/college-careers-more/personal-finance', desc: 'Presupuestos, ahorro, crédito e inversión', tipo: 'ejercicios', nivel: 'basico', fuente: 'khanacademy' },
      { titulo: 'Investopedia', url: 'https://www.investopedia.com/', desc: 'Conceptos financieros y económicos explicados claramente', tipo: 'articulo', nivel: 'intermedio', fuente: 'academico' },
    ],
  },
  literatura: {
    kw: ['literatur', 'redaccion', 'escritura', 'lectura', 'lenguaje', 'ortografi', 'gramatic', 'espanol', 'lengua', 'ensayo', 'novela'],
    items: [
      { titulo: 'Khan Academy - Lectura y Escritura', url: 'https://es.khanacademy.org/ela', desc: 'Gramática, comprensión lectora y composición escrita', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
      { titulo: 'RAE - Diccionario y recursos', url: 'https://www.rae.es/recursos', desc: 'Diccionario oficial, gramática y ortografía de la lengua española', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Cervantes Virtual', url: 'https://www.cervantesvirtual.com/', desc: 'Biblioteca digital con miles de obras literarias en español', tipo: 'articulo', nivel: 'todos', fuente: 'academico' },
      { titulo: 'Wikilengua', url: 'https://www.wikilengua.org/', desc: 'Guía práctica del español: dudas, ortografía y redacción', tipo: 'articulo', nivel: 'basico', fuente: 'academico' },
    ],
  },
};

const GENERAL = [
  { titulo: 'Khan Academy en español', url: 'https://es.khanacademy.org/', desc: 'Matemáticas, ciencias, historia, economía — todo gratis', tipo: 'ejercicios', nivel: 'todos', fuente: 'khanacademy' },
  { titulo: 'Coursera - Cursos gratuitos', url: 'https://www.coursera.org/', desc: 'Cursos de universidades del mundo, muchos auditables gratis', tipo: 'curso', nivel: 'intermedio', fuente: 'academico' },
  { titulo: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/', desc: 'Materiales reales de cursos del MIT, completamente gratis', tipo: 'curso', nivel: 'avanzado', fuente: 'academico' },
  { titulo: 'freeCodeCamp en español', url: 'https://www.freecodecamp.org/espanol/', desc: 'Programación web y ciencia de datos — gratis', tipo: 'curso', nivel: 'basico', fuente: 'academico' },
];

function detectarMateria(texto) {
  const txt = (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [materia, cfg] of Object.entries(CURADO)) {
    if (cfg.kw.some(kw => txt.includes(kw))) return materia;
  }
  return null;
}

function construirQueryYT(nombre, tareas, promedio) {
  const sufijo = promedio != null && promedio < 5 ? 'explicación básica principiantes' : 'tutorial explicación';
  return `${nombre} ${(tareas || []).slice(0, 3).join(' ')} ${sufijo}`.replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const nombre   = String(req.query.nombre || '');
    const promedio = req.query.promedio !== '' && req.query.promedio != null
      ? parseFloat(req.query.promedio) : null;
    const tareas   = req.query.tareas
      ? (Array.isArray(req.query.tareas) ? req.query.tareas : [req.query.tareas])
      : [];

    const materia = detectarMateria(`${nombre} ${tareas.join(' ')}`);
    const curados = materia ? CURADO[materia].items : GENERAL;

    // Fetch YouTube videos in parallel (only if API key exists)
    let videos = [];
    if (process.env.YOUTUBE_API_KEY) {
      const query = construirQueryYT(nombre, tareas, promedio);
      videos = (await buscarVideosYouTube(query, 6)) || [];
    }

    // Merge: videos first, then curated resources
    const items = [...videos, ...curados];

    return res.json({ ok: true, materia: materia || 'general', items });
  } catch (err) {
    console.error('Error /api/recomendaciones:', err);
    const fallback = [...GENERAL];
    return res.json({ ok: true, materia: 'general', items: fallback });
  }
}
