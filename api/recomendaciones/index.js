import { pool } from '../db.js';

// Curated resource map — reliable, no external API calls
const RECURSOS_MAPA = {
  matematicas: {
    keywords: ['matemat', 'algebra', 'calculo', 'geometr', 'estadist', 'trigonometr', 'aritmet', 'ecuacion', 'funcion', 'derivada', 'integral', 'numeros'],
    recursos: [
      { titulo: 'Khan Academy - Matemáticas', url: 'https://es.khanacademy.org/math', desc: 'Ejercicios interactivos y videos para todos los niveles de matemáticas', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'GeoGebra - Calculadora gráfica', url: 'https://www.geogebra.org/graphing', desc: 'Grafica funciones, resuelve ecuaciones y visualiza conceptos geométricos', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Wolfram Alpha - Resolutor de problemas', url: 'https://www.wolframalpha.com/', desc: 'Resuelve cualquier ecuación o problema matemático con pasos detallados', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Matemáticas con Paco (YouTube)', url: 'https://www.youtube.com/@MatemáticasconPaco', desc: 'Videos paso a paso en español, desde básico hasta bachillerato', tipo: 'video', nivel: 'basico' },
      { titulo: 'Desmos - Calculadora online', url: 'https://www.desmos.com/calculator', desc: 'Calculadora gráfica gratuita para explorar matemáticas de forma visual', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'MIT OpenCourseWare - Matemáticas', url: 'https://ocw.mit.edu/courses/mathematics/', desc: 'Cursos universitarios completos de matemáticas del MIT, totalmente gratis', tipo: 'curso', nivel: 'avanzado' },
    ],
  },
  fisica: {
    keywords: ['fisic', 'mecanic', 'electromagnetis', 'termodinam', 'optic', 'cinematica', 'dinamica', 'fuerza', 'energia', 'movimiento', 'onda', 'calor'],
    recursos: [
      { titulo: 'Khan Academy - Física', url: 'https://es.khanacademy.org/science/physics', desc: 'Videos y ejercicios de física desde nivel básico hasta universitario', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'PhET Simulaciones de Física', url: 'https://phet.colorado.edu/es/simulations/category/physics', desc: 'Laboratorios virtuales e interactivos de física de la Universidad de Colorado', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Fisicalab - Física en español', url: 'https://www.fisicalab.com/', desc: 'Teoría, fórmulas y ejercicios de física organizados por temas', tipo: 'articulo', nivel: 'basico' },
      { titulo: 'HyperPhysics', url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/hph.html', desc: 'Mapa conceptual interactivo de física con explicaciones profundas', tipo: 'articulo', nivel: 'intermedio' },
      { titulo: 'MIT OCW - Physics', url: 'https://ocw.mit.edu/courses/physics/', desc: 'Cursos completos de física del MIT con notas, videos y problemas', tipo: 'curso', nivel: 'avanzado' },
    ],
  },
  quimica: {
    keywords: ['quimic', 'organic', 'inorganic', 'estequiometr', 'reaccion', 'molecul', 'atomo', 'enlace', 'acido', 'electron', 'periodico', 'compuesto'],
    recursos: [
      { titulo: 'Khan Academy - Química', url: 'https://es.khanacademy.org/science/chemistry', desc: 'Videos y ejercicios de química general, orgánica e inorgánica', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'PhET - Simulaciones de Química', url: 'https://phet.colorado.edu/es/simulations/category/chemistry', desc: 'Laboratorios virtuales: reacciones, equilibrios, ácidos y bases', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Ptable - Tabla periódica interactiva', url: 'https://ptable.com/?lang=es', desc: 'Tabla periódica interactiva con propiedades de todos los elementos', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'LibreTexts - Química', url: 'https://chem.libretexts.org/', desc: 'Libros de texto de química de acceso abierto y gratuito', tipo: 'articulo', nivel: 'intermedio' },
    ],
  },
  biologia: {
    keywords: ['biolog', 'celula', 'genetic', 'anatom', 'ecolog', 'evolucion', 'organism', 'ecosistem', 'adn', 'proteina', 'virus', 'bacteria', 'fotosintesis'],
    recursos: [
      { titulo: 'Khan Academy - Biología', url: 'https://es.khanacademy.org/science/biology', desc: 'Biología celular, genética, evolución y ecología con videos y ejercicios', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'HHMI BioInteractive', url: 'https://www.biointeractive.org/', desc: 'Recursos educativos de biología con videos, animaciones y actividades', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'Visible Body - Anatomía', url: 'https://www.visiblebody.com/learn', desc: 'Recursos de anatomía y fisiología humana en modelos 3D', tipo: 'herramienta', nivel: 'todos' },
      { titulo: 'LibreTexts - Biología', url: 'https://bio.libretexts.org/', desc: 'Libros de texto de biología actualizados y de acceso libre', tipo: 'articulo', nivel: 'intermedio' },
    ],
  },
  programacion: {
    keywords: ['program', 'codigo', 'software', 'algoritm', 'javascript', 'python', 'java', 'html', 'css', 'web', 'app', 'inform', 'computacion', 'desarrollo', 'base de dato', 'sql', 'redes'],
    recursos: [
      { titulo: 'freeCodeCamp en español', url: 'https://www.freecodecamp.org/espanol/', desc: 'Aprende HTML, CSS, JavaScript y más con proyectos reales — completamente gratis', tipo: 'curso', nivel: 'basico' },
      { titulo: 'MDN Web Docs - JavaScript', url: 'https://developer.mozilla.org/es/docs/Web/JavaScript', desc: 'Documentación oficial de JavaScript con guías completas en español', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'CS50 de Harvard (gratis)', url: 'https://cs50.harvard.edu/x/', desc: 'El curso de ciencias de la computación más famoso del mundo, completamente gratis', tipo: 'curso', nivel: 'intermedio' },
      { titulo: 'Codecademy - Cursos interactivos', url: 'https://www.codecademy.com/', desc: 'Aprende Python, SQL, Web Development y más con ejercicios en el navegador', tipo: 'ejercicios', nivel: 'basico' },
      { titulo: 'The Odin Project', url: 'https://www.theodinproject.com/', desc: 'Ruta completa de aprendizaje de desarrollo web full-stack, gratis y en línea', tipo: 'curso', nivel: 'basico' },
      { titulo: 'SQLZoo - SQL interactivo', url: 'https://sqlzoo.net/', desc: 'Aprende SQL con ejercicios interactivos directamente en el navegador', tipo: 'ejercicios', nivel: 'basico' },
    ],
  },
  ingles: {
    keywords: ['ingles', 'english', 'grammar', 'writing', 'reading', 'idioma', 'pronunciacion', 'vocabular', 'listening'],
    recursos: [
      { titulo: 'Duolingo - Inglés', url: 'https://www.duolingo.com/', desc: 'Aprende inglés con lecciones diarias gamificadas, gratis desde el navegador', tipo: 'ejercicios', nivel: 'basico' },
      { titulo: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish/', desc: 'Gramática, vocabulario y pronunciación con contenido de la BBC', tipo: 'curso', nivel: 'todos' },
      { titulo: 'Cambridge English - Práctica oficial', url: 'https://www.cambridgeenglish.org/learning-english/', desc: 'Recursos oficiales de Cambridge para preparar exámenes internacionales', tipo: 'ejercicios', nivel: 'intermedio' },
      { titulo: 'British Council - LearnEnglish', url: 'https://learnenglish.britishcouncil.org/', desc: 'Recursos de inglés del British Council: gramática, vocabulario y habilidades', tipo: 'curso', nivel: 'todos' },
    ],
  },
  historia: {
    keywords: ['histor', 'social', 'geograf', 'cultur', 'civilizacion', 'guerra', 'politica', 'sociedad', 'republica', 'independencia', 'colonial'],
    recursos: [
      { titulo: 'Khan Academy - Historia del mundo', url: 'https://es.khanacademy.org/humanities/world-history', desc: 'Historia del mundo desde la prehistoria hasta el siglo XXI con videos', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'Crash Course History (YouTube)', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtMwmepBjTSG593eG7ObzO7s', desc: 'Videos cortos y entretenidos de historia mundial narrados con humor', tipo: 'video', nivel: 'basico' },
      { titulo: 'National Geographic Education', url: 'https://education.nationalgeographic.org/', desc: 'Recursos de geografía, historia natural y culturas del mundo', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'Historia de Ecuador - Wikipedia', url: 'https://es.wikipedia.org/wiki/Historia_del_Ecuador', desc: 'Historia detallada del Ecuador desde la época precolombina hasta hoy', tipo: 'articulo', nivel: 'basico' },
    ],
  },
  economia: {
    keywords: ['econom', 'finanz', 'contabil', 'administr', 'empresa', 'mercado', 'negoci', 'microeconom', 'macroeconom', 'presupuesto', 'inversion', 'comercio'],
    recursos: [
      { titulo: 'Khan Academy - Economía y Finanzas', url: 'https://es.khanacademy.org/economics-finance-domain', desc: 'Microeconomía, macroeconomía y finanzas personales con videos y ejercicios', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'Investopedia - Conceptos financieros', url: 'https://www.investopedia.com/', desc: 'Diccionario financiero y artículos educativos sobre economía y mercados', tipo: 'articulo', nivel: 'intermedio' },
      { titulo: 'Coursera - Finance for Everyone', url: 'https://www.coursera.org/learn/finance-for-everyone', desc: 'Curso gratuito de conceptos financieros accesible sin conocimientos previos', tipo: 'curso', nivel: 'basico' },
    ],
  },
  literatura: {
    keywords: ['literatur', 'redaccion', 'escritura', 'lectura', 'lenguaje', 'comunicacion', 'ortografi', 'gramatic', 'texto', 'ensayo', 'novela', 'poesia', 'lengua', 'español'],
    recursos: [
      { titulo: 'Khan Academy - Lectura y Escritura', url: 'https://es.khanacademy.org/ela', desc: 'Gramática, comprensión lectora y composición escrita en español', tipo: 'ejercicios', nivel: 'todos' },
      { titulo: 'Cervantes Virtual - Biblioteca digital', url: 'https://www.cervantesvirtual.com/', desc: 'Miles de obras literarias en español de libre acceso', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'RAE - Recursos de lengua española', url: 'https://www.rae.es/recursos', desc: 'Recursos oficiales de la Real Academia Española: diccionario, gramática, ortografía', tipo: 'articulo', nivel: 'todos' },
      { titulo: 'Wikilengua - Guía práctica del español', url: 'https://www.wikilengua.org/', desc: 'Guía de uso del español: dudas frecuentes, ortografía y redacción', tipo: 'articulo', nivel: 'basico' },
    ],
  },
};

const DEFAULT_RECURSOS = [
  { titulo: 'Khan Academy en español', url: 'https://es.khanacademy.org/', desc: 'Más de 10.000 ejercicios y videos educativos gratuitos en español para todas las materias', tipo: 'ejercicios', nivel: 'todos' },
  { titulo: 'Coursera - Cursos universitarios gratuitos', url: 'https://www.coursera.org/', desc: 'Cursos de las mejores universidades del mundo, muchos auditables gratis', tipo: 'curso', nivel: 'intermedio' },
  { titulo: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/', desc: 'Materiales de cursos reales del MIT disponibles gratuitamente', tipo: 'curso', nivel: 'avanzado' },
  { titulo: 'YouTube Edu', url: 'https://www.youtube.com/education', desc: 'Canal educativo de YouTube con videos verificados en todas las materias', tipo: 'video', nivel: 'todos' },
];

function detectarMateria(texto) {
  const txt = (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [materia, config] of Object.entries(RECURSOS_MAPA)) {
    if (config.keywords.some(kw => txt.includes(kw))) return materia;
  }
  return null;
}

function filtrarPorNivel(recursos, promedio) {
  if (promedio === null) return recursos;
  const nivel = promedio < 5 ? 'basico' : promedio < 7 ? 'intermedio' : 'avanzado';
  const orden = { basico: 0, intermedio: 1, avanzado: 2, todos: 0 };
  const maxNivel = nivel === 'basico' ? 1 : nivel === 'intermedio' ? 2 : 3;
  return [...recursos]
    .sort((a, b) => {
      const pa = orden[a.nivel] ?? 1, pb = orden[b.nivel] ?? 1;
      if (nivel === 'basico') return pa - pb;
      if (nivel === 'avanzado') return pb - pa;
      return pa - pb;
    })
    .filter(r => (orden[r.nivel] ?? 1) <= maxNivel || r.nivel === 'todos');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const cursoId = Number(req.query.curso_id || req.query.cursoId) || null;
    const tareaId = Number(req.query.tarea_id || req.query.tareaId) || null;
    const userId = req.cookies?.user_id || null;

    let nombreCurso = '';
    let nombreTarea = '';
    let promedio = null;

    // Get course name
    if (cursoId) {
      const [rows] = await pool.query(
        'SELECT nombre FROM cursos WHERE id = ? LIMIT 1',
        [cursoId]
      );
      nombreCurso = rows[0]?.nombre || '';
    }

    // Get task name + student's average grade for this course
    if (tareaId) {
      const [rows] = await pool.query(
        'SELECT titulo FROM tareas WHERE id = ? LIMIT 1',
        [tareaId]
      );
      nombreTarea = rows[0]?.titulo || '';
    }

    // Compute student's average grade for the course
    if (cursoId && userId) {
      const [rows] = await pool.query(
        `SELECT AVG(e.calificacion::float) AS promedio
         FROM tareas t
         LEFT JOIN (
           SELECT DISTINCT ON (tarea_id) tarea_id, calificacion
           FROM tareas_entregas
           WHERE estudiante_id = ?
           ORDER BY tarea_id, fecha_entrega DESC
         ) e ON e.tarea_id = t.id
         WHERE t.curso_id = ? AND e.calificacion IS NOT NULL`,
        [userId, cursoId]
      );
      if (rows[0]?.promedio != null) {
        promedio = parseFloat(Number(rows[0].promedio).toFixed(1));
      }
    }

    const textoAnalisis = `${nombreCurso} ${nombreTarea}`.trim();
    const materia = detectarMateria(textoAnalisis);
    const pool_recursos = materia ? RECURSOS_MAPA[materia].recursos : DEFAULT_RECURSOS;
    const items = filtrarPorNivel(pool_recursos, promedio);

    return res.json({
      ok: true,
      materia: materia || 'general',
      promedio_alumno: promedio,
      items,
    });
  } catch (err) {
    console.error('Error /api/recomendaciones:', err);
    return res.json({ ok: true, materia: 'general', items: DEFAULT_RECURSOS });
  }
}
