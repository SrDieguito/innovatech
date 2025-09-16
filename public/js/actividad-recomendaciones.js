/**
 * Módulo de recomendaciones para la página de actividad
 * Muestra recursos de aprendizaje recomendados cuando la calificación es < 7
 */

/**
 * Obtiene recomendaciones para la tarea actual
 * @param {number} tareaId - ID de la tarea
 * @param {number} cursoId - ID del curso
 * @returns {Promise<Object>} Datos de las recomendaciones
 */
async function getRecomendaciones(tareaId, cursoId) {
  try {
    const response = await fetch(`/api/recomendaciones?tarea_id=${tareaId}&curso_id=${cursoId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar recomendaciones');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    return { error: error.message };
  }
}

/**
 * Muestra las recomendaciones en la interfaz
 * @param {Object} data - Datos de las recomendaciones
 */
function mostrarRecomendaciones(data) {
  const container = document.getElementById('recomendaciones-container');
  const loading = document.getElementById('recomendaciones-loading');
  const empty = document.getElementById('recomendaciones-empty');
  const list = document.getElementById('recomendaciones-list');
  
  // Ocultar indicador de carga
  loading.classList.add('hidden');
  
  // Verificar si hay un error o no hay datos
  if (data.error || !data.recursos || data.recursos.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  
  // Mostrar la sección de recomendaciones
  container.classList.remove('hidden');
  
  // Limpiar lista existente
  list.innerHTML = '';
  
  // Agregar cada recurso a la lista
  data.recursos.forEach(recurso => {
    const card = document.createElement('div');
    card.className = 'recomendacion-card';
    
    // Determinar el ícono según la fuente
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
    
    list.appendChild(card);
  });
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
  initActividadRecomendaciones,
  getRecomendaciones,
  mostrarRecomendaciones
};
