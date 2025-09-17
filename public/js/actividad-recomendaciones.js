let lastKey = '';

async function apiRecs({ tareaId, cursoId }) {
  console.log('Solicitando recomendaciones para:', { tareaId, cursoId });
  const url = `/api/recomendaciones?action=por-tarea&tarea_id=${encodeURIComponent(tareaId)}`;
  
  try {
    console.log('Realizando petición a:', url);
    const r = await fetch(url, { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Respuesta recibida. Status:', r.status);
    
    if (!r.ok) {
      const errorText = await r.text().catch(() => 'No se pudo obtener el texto de error');
      console.error('Error en la respuesta de la API:', {
        status: r.status,
        statusText: r.statusText,
        errorText
      });
      throw new Error(`HTTP ${r.status}: ${r.statusText}`);
    }
    
    const data = await r.json().catch(err => {
      console.error('Error al parsear la respuesta JSON:', err);
      throw new Error('Respuesta inválida del servidor');
    });
    
    console.log('Datos recibidos:', data);
    
    // Handle the case where recommendations are not shown
    if (!data.mostrar) {
      console.log('No se muestran recomendaciones:', data.motivo || 'Razón no especificada');
      return [];
    }
    
    // Return the recursos array from the response
    return data.recursos || [];
  } catch (error) {
    console.error('Error en apiRecs:', error);
    throw error; // Re-lanzar para manejarlo en loadRecsFor
  }
}

export async function loadRecsFor(tareaId, cursoId) {
  console.log('loadRecsFor llamado con:', { tareaId, cursoId });
  const key = `${tareaId}|${cursoId}`;
  
  if (!tareaId) {
    console.warn('No se proporcionó tareaId');
    return;
  }
  
  if (key === lastKey) {
    console.log('Misma tarea/curso que la última búsqueda, omitiendo');
    return;
  }
  
  lastKey = key;
  const cont = document.getElementById('lista-recomendaciones');
  
  if (!cont) {
    console.warn('No se encontró el contenedor de recomendaciones');
    return;
  }
  
  // Mostrar indicador de carga
  cont.innerHTML = `
    <div class="p-4">
      <div class="flex items-center space-x-2 text-gray-600">
        <div class="w-5 h-5 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        <span>Buscando recursos educativos...</span>
      </div>
    </div>
  `;

  try {
    console.log('Cargando recomendaciones...');
    const items = await apiRecs({ tareaId, cursoId });
    console.log('Renderizando', items.length, 'recomendaciones');
    renderRecs(items);
  } catch (e) {
    console.error('Error al cargar recomendaciones:', e);
    // Mostrar mensaje de error amigable
    cont.innerHTML = `
      <div class="p-4 text-sm text-red-600 bg-red-50 rounded">
        <p class="font-medium">No se pudieron cargar las recomendaciones</p>
        <p class="mt-1 text-red-500">${e.message || 'Error desconocido'}</p>
        <button onclick="window.location.reload()" class="mt-2 px-3 py-1 text-sm bg-white border border-red-200 rounded hover:bg-red-50">
          Reintentar
        </button>
      </div>
    `;
  }
}

function renderRecs(items) {
  const cont = document.getElementById('lista-recomendaciones');
  if (!cont) return;

  if (!items || !items.length) {
    cont.innerHTML = `
      <div class="p-4 text-center text-gray-500">
        <p>No se encontraron recursos recomendados en este momento.</p>
        <p class="text-sm mt-2">Intenta más tarde o consulta con tu profesor.</p>
      </div>`;
    return;
  }

  cont.innerHTML = items.map(item => {
    // Handle different item formats
    const title = item.titulo || 'Recurso sin título';
    const description = item.descripcion || item.resumen || '';
    const source = item.fuente || item.source || 'Fuente desconocida';
    const url = item.url || '#';
    
    // Create links section if available
    let linksHtml = '';
    if (Array.isArray(item.enlaces) && item.enlaces.length > 0) {
      linksHtml = `
        <div class="mt-2 pt-2 border-t border-gray-100">
          <p class="text-xs font-medium text-gray-500 mb-1">Enlaces relacionados:</p>
          <ul class="space-y-1">
            ${item.enlaces.slice(0, 3).map(link => `
              <li class="text-xs">
                <a href="${link.url}" target="_blank" rel="noopener" 
                   class="text-blue-600 hover:underline flex items-center">
                  <span class="truncate">${link.text || 'Enlace'}</span>
                  <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>`;
    }
    
    return `
      <div class="p-4 mb-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors">
        <a href="${url}" target="_blank" rel="noopener" class="block">
          <h3 class="font-medium text-blue-700 hover:underline">${escapeHtml(title)}</h3>
          ${description ? `<p class="mt-1 text-sm text-gray-600 line-clamp-2">${escapeHtml(description)}</p>` : ''}
        </a>
        ${linksHtml}
        <div class="mt-2 flex items-center justify-between">
          <span class="text-xs text-gray-500">${source}</span>
          ${item.licencia ? `<span class="text-xs text-gray-400">${item.licencia}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

// --- mantener panel abierto: evita cierres por delegaciones globales ---
function bindPanelPersistence() {
  const panel = document.getElementById('panel-recomendaciones');
  if (!panel) return;

  // Evita que clicks dentro del panel disparen handlers globales (dropdown/click-away).
  panel.addEventListener('click', (e) => e.stopPropagation());

  // Si hay lógicas que "colapsan" por CSS clases, forzamos visibilidad del panel.
  panel.classList.add('recs-sticky');
}

function initFromURL() {
  const sp = new URLSearchParams(location.search);
  const tareaId = Number(sp.get('tareaId') || sp.get('tarea_id'));
  const cursoId = Number(sp.get('cursoId') || sp.get('curso_id'));
  if (tareaId) loadRecsFor(tareaId, cursoId);
}

// Función para escapar HTML
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  bindPanelPersistence();
  initFromURL();
  
  // Add event listener for the refresh button
  const refreshBtn = document.getElementById('btn-toggle-recomendaciones');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const sp = new URLSearchParams(location.search);
      const tareaId = Number(sp.get('tareaId') || sp.get('tarea_id'));
      const cursoId = Number(sp.get('cursoId') || sp.get('curso_id'));
      if (tareaId) {
        lastKey = ''; // Reset lastKey to force refresh
        loadRecsFor(tareaId, cursoId);
      }
    });
  }
});

// Exponer para que actividad.js pueda refrescar al cambiar de tarea
window.loadRecsFor = loadRecsFor;
