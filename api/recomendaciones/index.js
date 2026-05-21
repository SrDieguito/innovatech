// Curated resource map — no external API calls, always works
const RECURSOS_MAPA = {
  matematicas: {
    keywords: ['matemat', 'algebra', 'calculo', 'geometr', 'estadist', 'trigonometr', 'aritmet', 'ecuacion', 'funcion', 'derivada', 'integral', 'numeros'],
    recursos: [
      { titulo: 'Khan Academy - Matemáticas', url: 'https://es.khanacademy.org/math', desc: 'Ejercicios interactivos y videos para todos los niveles de matemáticas', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'GeoGebra - Calculadora gráfica', url: 'https://www.geogebra.org/graphing', desc: 'Grafica funciones, resuelve ecuaciones y visualiza conceptos matemáticos', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Wolfram Alpha - Resolutor', url: 'https://www.wolframalpha.com/', desc: 'Resuelve cualquier ecuación o problema matemático con pasos detallados', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Matemáticas con Paco (YouTube)', url: 'https://www.youtube.com/@MatemáticasconPaco', desc: 'Videos paso a paso en español, desde básico hasta bachillerato', tipo: 'video', nivel: 'basico' },
      { titulo: 'Desmos - Calculadora online', url: 'https://www.desmos.com/calculator', desc: 'Calculadora gráfica gratuita para explorar funciones de forma visual', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'MIT OpenCourseWare - Matemáticas', url: 'https://ocw.mit.edu/courses/mathematics/', desc: 'Cursos universitarios completos de matemáticas del MIT, gratis', tipo: 'curso', nivel: 'avanzado' },
    ],
  },
  fisica: {
    keywords: ['fisic', 'mecanic', 'electromagnetis', 'termodinam', 'optic', 'cinematica', 'dinamica', 'fuerza', 'energia', 'movimiento', 'onda', 'calor'],
    recursos: [
      { titulo: 'Khan Academy - Física', url: 'https://es.khanacademy.org/science/physics', desc: 'Videos y ejercicios de física desde nivel básico hasta universitario', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'PhET Simulaciones de Física', url: 'https://phet.colorado.edu/es/simulations/category/physics', desc: 'Laboratorios virtuales e interactivos de la Universidad de Colorado', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Fisicalab - Física en español', url: 'https://www.fisicalab.com/', desc: 'Teoría, fórmulas y ejercicios de física organizados por temas', tipo: 'articulo', nivel: 'basico' },
      { titulo: 'HyperPhysics', url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/hph.html', desc: 'Mapa conceptual interactivo de física con explicaciones profundas', tipo: 'articulo', nivel: 'intermedio' },
      { titulo: 'MIT OCW - Physics', url: 'https://ocw.mit.edu/courses/physics/', desc: 'Cursos de física del MIT con videos, notas y problemas', tipo: 'curso', nivel: 'avanzado' },
    ],
  },
  quimica: {
    keywords: ['quimic', 'organic', 'inorganic', 'estequiometr', 'reaccion', 'molecul', 'atomo', 'enlace', 'acido', 'electron', 'periodico', 'compuesto'],
    recursos: [
      { titulo: 'Khan Academy - Química', url: 'https://es.khanacademy.org/science/chemistry', desc: 'Videos y ejercicios de química general, orgánica e inorgánica', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'PhET - Simulaciones de Química', url: 'https://phet.colorado.edu/es/simulations/category/chemistry', desc: 'Laboratorios virtuales: reacciones, equilibrios, ácidos y bases', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Ptable - Tabla periódica interactiva', url: 'https://ptable.com/?lang=es', desc: 'Tabla periódica con propiedades completas de todos los elementos', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'LibreTexts - Química', url: 'https://chem.libretexts.org/', desc: 'Libros de texto de química de acceso abierto y gratuito', tipo: 'articulo', nivel: 'intermedio' },
    ],
  },
  biologia: {
    keywords: ['biolog', 'celula', 'genetic', 'anatom', 'ecolog', 'evolucion', 'organism', 'ecosistem', 'adn', 'proteina', 'virus', 'bacteria', 'fotosintesis'],
    recursos: [
      { titulo: 'Khan Academy - Biología', url: 'https://es.khanacademy.org/science/biology', desc: 'Biología celular, genética, evolución y ecología con videos y ejercicios', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'HHMI BioInteractive', url: 'https://www.biointeractive.org/', desc: 'Recursos de biología con videos, animaciones y actividades interactivas', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Visible Body - Anatomía', url: 'https://www.visiblebody.com/learn', desc: 'Recursos de anatomía y fisiología humana', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'LibreTexts - Biología', url: 'https://bio.libretexts.org/', desc: 'Libros de texto de biología actualizados y de acceso libre', tipo: 'articulo', nivel: 'intermedio' },
    ],
  },
  programacion: {
    keywords: ['program', 'codigo', 'software', 'algoritm', 'javascript', 'python', 'java', 'html', 'css', 'web', 'app', 'inform', 'computacion', 'desarrollo', 'sql', 'redes', 'base de dato', 'tecnolog'],
    recursos: [
      { titulo: 'freeCodeCamp en español', url: 'https://www.freecodecamp.org/espanol/', desc: 'Aprende HTML, CSS, JavaScript y más con proyectos reales — completamente gratis', tipo: 'curso', nivel: 'basico' },
      { titulo: 'MDN Web Docs - JavaScript', url: 'https://developer.mozilla.org/es/docs/Web/JavaScript', desc: 'Documentación oficial de JavaScript con guías completas en español', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'CS50 de Harvard (gratis)', url: 'https://cs50.harvard.edu/x/', desc: 'El curso de ciencias de la computación más famoso del mundo', tipo: 'curso', nivel: 'intermedio' },
      { titulo: 'Codecademy - Cursos interactivos', url: 'https://www.codecademy.com/', desc: 'Aprende Python, SQL, Web Development con ejercicios en el navegador', tipo: 'ejercicios', nivel: 'basico' },
      { titulo: 'The Odin Project', url: 'https://www.theodinproject.com/', desc: 'Ruta completa de desarrollo web full-stack, gratis en línea', tipo: 'curso', nivel: 'basico' },
      { titulo: 'SQLZoo - SQL interactivo', url: 'https://sqlzoo.net/', desc: 'Aprende SQL con ejercicios directamente en el navegador', tipo: 'ejercicios', nivel: 'basico' },
    ],
  },
  ingles: {
    keywords: ['ingles', 'english', 'grammar', 'writing', 'reading', 'idioma', 'pronunciacion', 'vocabular', 'listening'],
    recursos: [
      { titulo: 'Duolingo - Inglés', url: 'https://www.duolingo.com/', desc: 'Aprende inglés con lecciones diarias gamificadas, gratis', tipo: 'ejercicios', nivel: 'basico' },
      { titulo: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', desc: 'Gramática, vocabulario y pronunciación con contenido de la BBC', tipo: 'curso', nivel: 'todos' },
      { titulo: 'Cambridge English - Práctica', url: 'https://www.cambridgeenglish.org/learning-english/', desc: 'Recursos oficiales de Cambridge para practicar inglés', tipo: 'ejercicios', nivel: 'intermedio' },
      { titulo: 'British Council - LearnEnglish', url: 'https://learnenglish.britishcouncil.org/', desc: 'Recursos del British Council: gramática, vocabulario y habilidades', tipo: 'curso', nivel: 'todos' },
    ],
  },
  historia: {
    keywords: ['histor', 'social', 'geograf', 'cultur', 'civilizacion', 'guerra', 'politica', 'sociedad', 'republica', 'independencia', 'colonial'],
    recursos: [
      { titulo: 'Khan Academy - Historia del mundo', url: 'https://es.khanacademy.org/humanities/world-history', desc: 'Historia del mundo desde la prehistoria hasta hoy con videos', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'Crash Course History (YouTube)', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtMwmepBjTSG593eG7ObzO7s', desc: 'Videos cortos y entretenidos de historia mundial narrados con humor', tipo: 'video', nivel: 'basico' },
      { titulo: 'National Geographic Education', url: 'https://education.nationalgeographic.org/', desc: 'Recursos de geografía, historia y ciencias naturales', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'Historia del Ecuador - Wikipedia', url: 'https://es.wikipedia.org/wiki/Historia_del_Ecuador', desc: 'Historia detallada del Ecuador desde la época precolombina', tipo: 'articulo', nivel: 'basico' },
    ],
  },
  economia: {
    keywords: ['econom', 'finanz', 'contabil', 'administr', 'empresa', 'mercado', 'negoci', 'microeconom', 'macroeconom', 'presupuesto', 'inversion', 'comercio'],
    recursos: [
      { titulo: 'Khan Academy - Economía y Finanzas', url: 'https://es.khanacademy.org/economics-finance-domain', desc: 'Microeconomía, macroeconomía y finanzas con videos y ejercicios', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'Investopedia - Conceptos financieros', url: 'https://www.investopedia.com/', desc: 'Diccionario financiero y artículos sobre economía y mercados', tipo: 'articulo', nivel: 'intermedio' },
      { titulo: 'Coursera - Finance for Everyone', url: 'https://www.coursera.org/learn/finance-for-everyone', desc: 'Curso gratuito de conceptos financieros sin conocimientos previos', tipo: 'curso', nivel: 'basico' },
    ],
  },
  literatura: {
    keywords: ['literatur', 'redaccion', 'escritura', 'lectura', 'lenguaje', 'comunicacion', 'ortografi', 'gramatic', 'texto', 'ensayo', 'novela', 'poesia', 'lengua', 'espanol'],
    recursos: [
      { titulo: 'Khan Academy - Lectura y Escritura', url: 'https://es.khanacademy.org/ela', desc: 'Gramática, comprensión lectora y composición escrita', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'Cervantes Virtual - Biblioteca digital', url: 'https://www.cervantesvirtual.com/', desc: 'Miles de obras literarias en español de libre acceso', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'RAE - Recursos de lengua española', url: 'https://www.rae.es/recursos', desc: 'Diccionario, gramática y ortografía de la Real Academia Española', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'Wikilengua - Guía práctica del español', url: 'https://www.wikilengua.org/', desc: 'Guía de uso del español: dudas frecuentes, ortografía y redacción', tipo: 'articulo', nivel: 'basico' },
    ],
  },
};

const DEFAULT_RECURSOS = [
  { titulo: 'Khan Academy en español', url: 'https://es.khanacademy.org/', desc: 'Más de 10.000 ejercicios y videos educativos gratuitos en español', tipo: 'ejercicios', nivel: 'todos' },
  { titulo: 'Coursera - Cursos universitarios gratuitos', url: 'https://www.coursera.org/', desc: 'Cursos de las mejores universidades del mundo, muchos auditables gratis', tipo: 'curso', nivel: 'intermedio' },
  { titulo: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/', desc: 'Materiales de cursos reales del MIT disponibles gratuitamente', tipo: 'curso', nivel: 'avanzado' },
  { titulo: 'YouTube Edu', url: 'https://www.youtube.com/education', desc: 'Canal educativo de YouTube con videos verificados en todas las materias', tipo: 'video', nivel: 'todos' },
];

function detectarMateria(texto) {
  // Strip accents safely using unicode escapes
  const txt = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  for (const [materia, config] of Object.entries(RECURSOS_MAPA)) {
    if (config.keywords.some(kw => txt.includes(kw))) return materia;
  }
  return null;
}

function ordenarPorNivel(recursos, promedio) {
  if (promedio == null || isNaN(promedio)) return recursos;
  // Low grade → push basic resources first; high grade → advanced first
  const peso = { basico: 0, todos: 1, intermedio: 2, avanzado: 3 };
  const esBajo = promedio < 7;
  return [...recursos].sort((a, b) => {
    const pa = peso[a.nivel] ?? 1;
    const pb = peso[b.nivel] ?? 1;
    return esBajo ? pa - pb : pb - pa;
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // Frontend passes the course name directly — no DB query needed
    const nombre = String(req.query.nombre || req.query.curso_nombre || '');
    const promedio = req.query.promedio != null && req.query.promedio !== ''
      ? parseFloat(req.query.promedio)
      : null;

    const materia = detectarMateria(nombre);
    const base = materia ? RECURSOS_MAPA[materia].recursos : DEFAULT_RECURSOS;
    const items = ordenarPorNivel(base, promedio);

    return res.json({ ok: true, materia: materia || 'general', items });
  } catch (err) {
    console.error('Error /api/recomendaciones:', err);
    return res.json({ ok: true, materia: 'general', items: DEFAULT_RECURSOS });
  }
}
