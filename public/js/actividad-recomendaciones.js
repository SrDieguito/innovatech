/**
 * Módulo de recomendaciones para la página de actividad
 * Muestra recomendaciones para estudiantes en la entrega de tareas
 */

// Referencias a los elementos del DOM
const recomendacionesSection = document.getElementById('recomendaciones-estudiante');
const btnOcultarRecomendaciones = document.getElementById('btn-ocultar-recomendaciones');

/**
 * Muestra u oculta la sección de recomendaciones
 * @param {boolean} show - Indica si se debe mostrar u ocultar la sección
 */
function toggleRecomendaciones(show = true) {
  if (recomendacionesSection) {
    if (show) {
      recomendacionesSection.classList.remove('hidden');
      // Guardar preferencia de visibilidad en localStorage
      localStorage.setItem('recomendaciones-visible', 'true');
    } else {
      recomendacionesSection.classList.add('hidden');
      localStorage.setItem('recomendaciones-visible', 'false');
    }
  }
}

/**
 * Inicializa los event listeners para la sección de recomendaciones
 */
function initEventListeners() {
  // Botón para ocultar las recomendaciones
  if (btnOcultarRecomendaciones) {
    btnOcultarRecomendaciones.addEventListener('click', () => {
      toggleRecomendaciones(false);
    });
  }

  // Mostrar recomendaciones al hacer clic en el botón de ayuda
  const btnMostrarRecomendaciones = document.getElementById('btn-mostrar-recomendaciones');
  if (btnMostrarRecomendaciones) {
    btnMostrarRecomendaciones.addEventListener('click', (e) => {
      e.preventDefault();
      toggleRecomendaciones(true);
    });
  }
}

/**
 * Inicializa la funcionalidad de recomendaciones para estudiantes
 * @param {string} userRole - Rol del usuario (estudiante, profesor, etc.)
 */
function initRecomendacionesEstudiante(userRole) {
  // Solo inicializar si el usuario es estudiante
  if (userRole !== 'estudiante') {
    return;
  }

  // Inicializar event listeners
  initEventListeners();

  // Mostrar recomendaciones por defecto (si no se ha guardado preferencia)
  const recomendacionesGuardadas = localStorage.getItem('recomendaciones-visible');
  if (recomendacionesGuardadas === null || recomendacionesGuardadas === 'true') {
    toggleRecomendaciones(true);
  }
}
/**
 * Muestra las recomendaciones en la interfaz
 * @param {Array} recomendaciones - Lista de recomendaciones a mostrar
 */
function mostrarRecomendaciones(recomendaciones) {
  const list = document.getElementById('recomendaciones-list');
  const empty = document.getElementById('recomendaciones-empty');
  const loading = document.getElementById('recomendaciones-loading');

  // Ocultar indicador de carga
  if (loading) loading.classList.add('hidden');

  // Verificar si hay recomendaciones
  if (!recomendaciones || recomendaciones.length === 0) {
    if (empty) {
      empty.textContent = 'No hay recomendaciones disponibles en este momento.';
      empty.classList.remove('hidden');
    }
    return;
  }

  // Limpiar lista
  if (list) list.innerHTML = '';

  // Mostrar cada recomendación
  recomendaciones.forEach(recurso => {
    const card = document.createElement('div');
    card.className = 'recomendacion-card';

    let icon = '';
    let sourceClass = '';
    let sourceText = '';
    
    if (recurso.fuente === 'khan') {
      icon = 'graduation-cap';
      sourceClass = 'fuente-khan';
      sourceText = 'Khan Academy';
    } else {
      icon = 'book';
      sourceClass = 'fuente-interna';
      sourceText = 'Recurso Interno';
    }
    
    // Crear el contenido de la tarjeta
    card.innerHTML = `
      <h4><i class="fas fa-${icon}"></i> ${recurso.titulo || 'Recurso de aprendizaje'}</h4>
      ${recurso.descripcion ? `<p>${recurso.descripcion}</p>` : ''}
      <div class="recomendacion-meta">
        <span class="fuente-badge ${sourceClass}">${sourceText}</span>
        ${recurso.dificultad ? `<span class="dificultad">${recurso.dificultad}</span>` : ''}
      </div>
      ${recurso.url ? `
        <a href="${recurso.url}" target="_blank" rel="noopener noreferrer" class="recomendacion-link">
          Ver recurso <i class="fas fa-external-link-alt"></i>
        </a>
      ` : ''}
    `;
    
    if (list) list.appendChild(card);
  });
}

/**
 * Obtiene las recomendaciones desde el servidor
 * @param {number} tareaId - ID de la tarea
 * @param {number} cursoId - ID del curso
 * @returns {Promise<Array>} Lista de recomendaciones
 */
async function getRecomendaciones(tareaId, cursoId) {
  try {
    const response = await fetch(`/api/recomendaciones?tareaId=${tareaId}&cursoId=${cursoId}`);
    if (!response.ok) {
      throw new Error('Error al obtener recomendaciones');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getRecomendaciones:', error);
    throw error;
  }
}

/**
 * Inicializa la funcionalidad de recomendaciones
 * @param {number} tareaId - ID de la tarea
 * @param {number} cursoId - ID del curso
 * @param {number} calificacion - Calificación del estudiante (opcional)
 */
async function initActividadRecomendaciones(tareaId, cursoId, calificacion) {
  // Si hay una calificación y es mayor o igual a 7, no mostrar recomendaciones
  if (calificacion !== undefined && calificacion >= 7) {
    return;
  }
  
  // Mostrar indicador de carga
  const loading = document.getElementById('recomendaciones-loading');
  loading.classList.remove('hidden');
  
  try {
    // Obtener recomendaciones
    const data = await getRecomendaciones(tareaId, cursoId);
    
    // Mostrar las recomendaciones
    mostrarRecomendaciones(data);
  } catch (error) {
    console.error('Error al inicializar recomendaciones:', error);
    const empty = document.getElementById('recomendaciones-empty');
    empty.textContent = 'No se pudieron cargar las recomendaciones. Intenta más tarde.';
    empty.classList.remove('hidden');
  }
}

// Exportar para uso en otros módulos
export {
  initRecomendacionesEstudiante,
  initActividadRecomendaciones,
  getRecomendaciones,
  mostrarRecomendaciones
};
