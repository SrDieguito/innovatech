/**
 * Módulo de recomendaciones para la página de actividad
 * Muestra recursos de aprendizaje recomendados cuando la calificación es < 7
 */

// URL base para las llamadas a la API
const API_BASE = `${window.location.origin}/api`;

/**
 * Obtiene recomendaciones para la tarea actual
 * @param {number} tareaId - ID de la tarea
 * @param {number} cursoId - ID del curso
 * @returns {Promise<Object>} Datos de las recomendaciones
 */
export async function getRecomendaciones({ tareaId, cursoId }) {
  const url = `${API_BASE}/recomendaciones?tarea_id=${encodeURIComponent(tareaId)}&curso_id=${encodeURIComponent(cursoId)}`;
  
  try {
    const response = await fetch(url, { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.warn('Recomendaciones HTTP', response.status);
      return { 
        ok: false, 
        data: { recursos: [] }, 
        error: 'http',
        status: response.status 
      };
    }
    
    const json = await response.json().catch(() => ({}));
    
    if (!json?.ok) {
      console.warn('Recomendaciones payload', json);
      return { 
        ok: false, 
        data: { recursos: [] }, 
        error: json?.error || 'payload' 
      };
    }
    
    return json;
  } catch (error) {
    console.error('Error en getRecomendaciones:', error);
    return { 
      ok: false, 
      data: { recursos: [] }, 
      error: 'network' 
    };
  }
}

/**
 * Muestra las recomendaciones en la interfaz
 * @param {Array} recursos - Lista de recursos a mostrar
 * @param {Object} meta - Metadatos adicionales (calificación, tema, fuente)
 */
function mostrarRecomendaciones(recursos = [], meta = {}) {
  const container = document.getElementById('recomendaciones-container');
  const loading = document.getElementById('recomendaciones-loading');
  const empty = document.getElementById('recomendaciones-empty');
  const list = document.getElementById('recomendaciones-list');
  
  // Ocultar indicador de carga
  if (loading) loading.classList.add('hidden');
  
  // Mostrar u ocultar contenedor principal
  if (container) {
    if (recursos.length > 0) {
      container.classList.remove('hidden');
    } else if (empty) {
      empty.classList.remove('hidden');
    }
  }
  
  // Limpiar lista existente
  if (list) {
    list.innerHTML = '';
    
    // Agregar cada recurso a la lista
    recursos.forEach(recurso => {
      const card = document.createElement('div');
      card.className = 'recomendacion-card';
      
      // Determinar el ícono según la fuente
      let icon = 'book';
      let sourceClass = 'fuente-interna';
      let sourceText = recurso.fuente || 'Recurso';
      
      if (recurso.fuente === 'khan' || recurso.licencia === 'KhanAcademy' || 
          recurso.url?.includes('khanacademy.org')) {
        icon = 'graduation-cap';
        sourceClass = 'fuente-khan';
        sourceText = 'Khan Academy';
      }
      
      // Crear el contenido de la tarjeta
      card.innerHTML = `
        <h4><i class="fas fa-${icon}"></i> ${recurso.titulo || 'Recurso de aprendizaje'}</h4>
        ${recurso.descripcion ? `<p class="text-sm text-gray-600 mt-1">${recurso.descripcion}</p>` : ''}
        <div class="flex justify-between items-center mt-2">
          <span class="text-xs px-2 py-1 rounded-full ${sourceClass}">${sourceText}</span>
          ${recurso.dificultad ? 
            `<span class="text-xs bg-gray-100 px-2 py-1 rounded">${recurso.dificultad}</span>` : ''}
        </div>
        ${recurso.url ? `
          <div class="mt-3">
            <a href="${recurso.url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="text-sm text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center">
              Ver recurso <i class="fas fa-external-link-alt ml-1 text-xs"></i>
            </a>
          </div>
        ` : ''}
      `;
      
      list.appendChild(card);
    });
  }
}

/**
 * Inicializa la funcionalidad de recomendaciones
 * @param {number} tareaId - ID de la tarea
 * @param {number} cursoId - ID del curso
 * @param {number} calificacion - Calificación del estudiante (opcional)
 */
export async function initActividadRecomendaciones({ tareaId, cursoId, calificacion }) {
  console.log('initActividadRecomendaciones called with:', { tareaId, cursoId, calificacion });
  
  // Si hay una calificación y es mayor o igual a 7, no mostrar recomendaciones
  if (calificacion !== undefined && calificacion >= 7) {
    console.log('No se muestran recomendaciones: calificación >= 7');
    return;
  }
  
  // Mostrar indicador de carga
  const loading = document.getElementById('recomendaciones-loading');
  const empty = document.getElementById('recomendaciones-empty');
  
  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  
  try {
    console.log('Obteniendo recomendaciones...');
    
    // Obtener recomendaciones
    const result = await getRecomendaciones({ tareaId, cursoId });
    console.log('Respuesta de la API:', result);
    
    // Mostrar las recomendaciones
    mostrarRecomendaciones(
      result.data?.recursos || [],
      {
        calificacion,
        tema: result.data?.tarea?.tema_slug,
        fuente: result.data?.fuente
      }
    );
  } catch (error) {
    console.error('Error al inicializar recomendaciones:', error);
    
    if (empty) {
      empty.textContent = 'No se pudieron cargar las recomendaciones. Intenta más tarde.';
      empty.classList.remove('hidden');
    }
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

// Exportar para uso en otros módulos
export {
  initActividadRecomendaciones,
  getRecomendaciones,
  mostrarRecomendaciones
};
