let lastKey = '';

function buildConsultaFromDOM() {
  // q = **nombre de la tarea** (título). Agarro varias opciones comunes.
  const selectors = [
    '#titulo-actividad',
    '#actividad-titulo',
    '.titulo-actividad',
    '.actividad-titulo',
    '[data-actividad-titulo]',
    'h1',
    'h2'
  ];
  
  // Buscar en los selectores por orden de prioridad
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const val = (el.getAttribute('data-actividad-titulo') || el.textContent || '').trim();
    if (val && val.length > 2) return val.slice(0, 200);
  }
  
  // Fallback: param ?titulo= en URL, si existiera
  const url = new URL(location.href);
  const t = (url.searchParams.get('titulo') || '').trim();
  if (t) return t.slice(0, 200);
  
  // Último recurso: buscar en cualquier parte del documento
  const fallback = document.body.innerText.trim().split('\n')[0];
  return (fallback || '').slice(0, 200);
}

async function apiRecs({ tareaId, cursoId, lang = 'es' }) {
  const q = buildConsultaFromDOM();
  console.log('Solicitando recomendaciones para:', { tareaId, cursoId, q });
  
  const u = new URL('/api/recomendaciones', location.origin);
  if (tareaId) u.searchParams.set('tareaId', tareaId);
  if (cursoId) u.searchParams.set('cursoId', cursoId);
  if (lang) u.searchParams.set('lang', lang);
  if (q) u.searchParams.set('q', q);
  
  console.log('Realizando petición a:', u.toString());
  
  try {
    const r = await fetch(u.toString(), { 
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
  const cont = document.getElementById('recs-container') || document.getElementById('lista-recomendaciones');
  
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

async function getRecomendaciones({ tareaId, cursoId, lang = 'es' }) {
  const u = new URL('/api/recomendaciones', location.origin);
  u.searchParams.set('tareaId', tareaId);
  u.searchParams.set('cursoId', cursoId);
  u.searchParams.set('lang', lang);
  const r = await fetch(u);
  if (!r.ok) throw new Error('Error al obtener recomendaciones');
  return r.json();
}

function renderRecs(items) {
  const cont = document.getElementById('recs-container') || document.getElementById('lista-recomendaciones');
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
    const title = item.titulo || item.title || 'Recurso sin título';
    const description = item.descripcion || item.extracto || item.resumen || '';
    const source = item.fuente || item.source || 'Fuente desconocida';
    const url = item.url || '#';
    const thumbnail = item.thumbnail || item.imagen;
    
    return `
      <a class="block p-3 mb-3 rounded-lg border border-gray-200 hover:shadow hover:border-blue-200 hover:bg-blue-50 transition-colors"
         href="${url}" target="_blank" rel="noopener">
        <div class="flex gap-3">
          ${thumbnail ? `<img src="${thumbnail}" class="w-16 h-16 object-cover rounded" alt="${title}"/>` : ''}
          <div class="flex-1">
            <h4 class="font-semibold text-blue-700">${escapeHtml(title)}</h4>
            ${description ? `<p class="mt-1 text-sm text-gray-600 line-clamp-2">${escapeHtml(description)}</p>` : ''}
            <span class="inline-block mt-1 text-xs text-gray-400">${source}${item.licencia ? ` • ${item.licencia}` : ''}</span>
          </div>
        </div>
      </a>`;
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
