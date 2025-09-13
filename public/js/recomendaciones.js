/**
 * Módulo de recomendaciones para tareas
 * Maneja la visualización de recomendaciones para cada tarea
 */

/**
 * Genera el HTML para la lista de recursos recomendados
 * @param {Array} lista - Lista de recursos recomendados
 * @returns {string} HTML de la lista de recursos
 */
function htmlRecursos(lista) {
  if (!lista?.length) return '<p class="text-sm text-gray-500">Sin recursos sugeridos.</p>';
  
  return `
    <ul class="space-y-2">
      ${lista.map(r => `
        <li class="border rounded p-2 bg-white">
          <div class="text-sm font-semibold">${r.titulo || 'Recurso'}</div>
          ${r.descripcion ? `<p class="text-xs text-gray-600">${r.descripcion}</p>`:''}
          ${r.url ? `<a class="text-xs underline text-blue-600" target="_blank" rel="noopener" href="${r.url}">Abrir</a>`:''}
          ${r.licencia ? `<span class="ml-2 text-[11px] text-gray-500">(${r.licencia})</span>`:''}
        </li>
      `).join('')}
    </ul>
  `;
}

/**
 * Inicializa los listeners para los botones de recomendaciones
 */
async function initRecomendaciones() {
  // Esperar a que exista el contenedor de tareas
  const checkContainer = setInterval(() => {
    const container = document.querySelector('#tasks-root');
    if (container) {
      clearInterval(checkContainer);
      setupRecomendacionButtons();
    }
  }, 500);
}

/**
 * Configura los botones de recomendaciones para todas las tareas
 */
function setupRecomendacionButtons() {
  const tareasContainer = document.querySelector('#tasks-root');
  if (!tareasContainer) return;

  // Usar event delegation para manejar clics dinámicamente
  tareasContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.reco-toggle');
    if (!btn) return;

    const tareaId = btn.dataset.tareaId;
    if (!tareaId) return;

    const box = document.getElementById(`reco-${tareaId}`);
    if (!box) return;

    // Alternar visibilidad
    box.classList.toggle('hidden');
    
    // Si ya se cargaron las recomendaciones, no hacer nada más
    if (box.dataset.loaded) return;

    // Mostrar indicador de carga
    box.innerHTML = '<div class="text-sm text-gray-500">Cargando recomendaciones...</div>';
    
    try {
      // Obtener el ID del estudiante del almacenamiento local
      const estudianteId = Number(localStorage.getItem('estudiante_id')) || 0;
      
      // Hacer la petición al endpoint de recomendaciones
      const url = `/api/recomendaciones?action=por-tarea&tarea_id=${tareaId}&estudiante_id=${estudianteId}`;
      const resp = await fetch(url, { credentials: 'include' });
      
      if (!resp.ok) throw new Error('Error al cargar recomendaciones');
      
      const data = await resp.json();
      
      // Actualizar la interfaz según la respuesta
      if (!data.mostrar) {
        box.innerHTML = `<p class="text-sm text-gray-500">${data.motivo || 'No hay recomendaciones para esta tarea.'}</p>`;
      } else {
        box.innerHTML = `
          <div class="mb-2 text-sm">
            <span class="font-semibold">Calificación:</span> ${data.calificacion || 'No disponible'}
          </div>
          ${htmlRecursos(data.recursos || [])}
        `;
      }
      
      // Marcar como cargado para no volver a hacer la petición
      box.dataset.loaded = '1';
      
    } catch (e) {
      console.error('Error al cargar recomendaciones:', e);
      box.innerHTML = '<p class="text-sm text-red-600">Error al cargar recomendaciones. Intenta de nuevo más tarde.</p>';
      
      // Permitir reintentar en caso de error
      box.dataset.loaded = '';
    }
  });
}

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initRecomendaciones);

// Exportar para uso en otros módulos
window.Recomendaciones = {
  init: initRecomendaciones,
  htmlRecursos
};
