let lastKey = '';

async function apiRecs({ tareaId, cursoId }) {
  console.log('Solicitando recomendaciones para:', { tareaId, cursoId });
  const url = `/api/recomendaciones?tareaId=${encodeURIComponent(tareaId)}&cursoId=${encodeURIComponent(cursoId||'')}`;
  
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
    return data.items || [];
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

  if (!items.length) {
    cont.innerHTML = `<div class="text-sm text-gray-500">No se encontraron recursos por ahora.</div>`;
    return;
  }

  cont.innerHTML = items.map(it => `
    <a data-rec-link href="${it.url}" target="_blank" rel="noopener"
       class="block p-3 mb-2 rounded-lg border hover:bg-gray-50 transition">
      <div class="font-medium">${it.titulo}</div>
      <div class="text-sm text-gray-600">${it.snippet||''}</div>
      <div class="mt-1 text-xs text-gray-400">${it.source||''}</div>
    </a>
  `).join('');
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
