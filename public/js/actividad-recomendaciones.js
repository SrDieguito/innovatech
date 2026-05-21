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

// Nueva función para obtener recomendaciones de Google (Gemini + Crossref)
async function apiRecsGoogle({ tareaId, cursoId }) {
  const q = buildConsultaFromDOM();
  console.log('Solicitando recomendaciones de Google para:', { tareaId, cursoId, q });
  
  const u = new URL('/api/recs-google', location.origin);
  if (tareaId) u.searchParams.set('tareaId', tareaId);
  if (cursoId) u.searchParams.set('cursoId', cursoId);
  if (q) u.searchParams.set('q', q);
  
  console.log('Realizando petición a Google API:', u.toString());
  
  try {
    const r = await fetch(u.toString(), { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Respuesta recibida de Google API. Status:', r.status);
    
    if (!r.ok) {
      const errorText = await r.text().catch(() => 'No se pudo obtener el texto de error');
      console.error('Error en la respuesta de Google API:', {
        status: r.status,
        statusText: r.statusText,
        errorText
      });
      throw new Error(`Error en la API de Google: ${r.status} ${r.statusText}`);
    }
    
    const data = await r.json().catch(err => {
      console.error('Error al parsear la respuesta JSON de Google:', err);
      throw new Error('Respuesta inválida del servidor de Google');
    });
    
    console.log('Datos recibidos de Google API:', data);
    
    if (!data.ok) {
      throw new Error(data.error || 'Error desconocido en la API de Google');
    }
    
    // Mapear los resultados al formato esperado
    return (data.items || []).map(item => ({
      title: item.title,
      description: item.authors ? `Autores: ${item.authors.join(', ')}` : 'Sin información de autores',
      year: item.year ? `Año: ${item.year}` : '',
      doi: item.doi,
      doi_url: item.doi_url,
      pdf_url: item.pdf_url,
      source: 'Google Scholar + Crossref',
      tipo: 'academico'
    }));
  } catch (error) {
    console.error('Error en apiRecsGoogle:', error);
    throw error;
  }
}

// Función original para mantener compatibilidad
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
        <span>Buscando recursos académicos...</span>
      </div>
    </div>
  `;

  try {
    console.log('Cargando recomendaciones académicas...');
    
    // Cargar primero las recomendaciones de Google (Gemini + Crossref)
    const googleItems = await apiRecsGoogle({ tareaId, cursoId });
    
    // Si hay resultados de Google, mostrarlos
    if (googleItems && googleItems.length > 0) {
      console.log('Renderizando', googleItems.length, 'recomendaciones académicas');
      renderRecs(googleItems);
      return;
    }
    
    // Si no hay resultados de Google, cargar las recomendaciones normales
    console.log('No se encontraron resultados académicos, cargando recomendaciones generales...');
    const items = await apiRecs({ tareaId, cursoId });
    
    if (items && items.length > 0) {
      console.log('Renderizando', items.length, 'recomendaciones generales');
      renderRecs(items);
    } else {
      // Mostrar mensaje de que no hay resultados
      cont.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <p>No se encontraron recursos recomendados en este momento.</p>
          <p class="text-sm mt-2">Intenta más tarde o consulta con tu profesor.</p>
        </div>`;
    }
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

  // Agrupar por tipo de recurso (académico vs general)
  const academicItems = items.filter(item => item.tipo === 'academico');
  const generalItems = items.filter(item => !item.tipo || item.tipo !== 'academico');
  
  let html = '';
  
  // Mostrar primero los recursos académicos
  if (academicItems.length > 0) {
    html += `
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Recursos Académicos</h3>
        <div class="space-y-3">
          ${academicItems.map(item => renderAcademicItem(item)).join('')}
        </div>
      </div>`;
  }
  
  // Luego los recursos generales
  if (generalItems.length > 0) {
    html += `
      <div class="mt-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Otros Recursos</h3>
        <div class="space-y-3">
          ${generalItems.map(item => renderGeneralItem(item)).join('')}
        </div>
      </div>`;
  }
  
  cont.innerHTML = html;
  
  // Función para renderizar un ítem académico
  function renderAcademicItem(item) {
    const title = item.title || item.titulo || 'Recurso sin título';
    const description = item.description || item.descripcion || '';
    const year = item.year || '';
    const doi = item.doi || '';
    const doiUrl = item.doi_url || `https://doi.org/${doi}`;
    const pdfUrl = item.pdf_url || '';
    
    return `
      <div class="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
        <h4 class="font-semibold text-gray-900">${escapeHtml(title)}</h4>
        
        ${description ? `<p class="mt-1 text-sm text-gray-600">${escapeHtml(description)}</p>` : ''}
        
        <div class="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-3 items-center text-xs text-gray-500">
          ${year ? `<span>${escapeHtml(year)}</span>` : ''}
          
          ${pdfUrl ? `
            <a href="${pdfUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Ver PDF
            </a>
          ` : ''}
          
          ${doi ? `
            <a href="${doiUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              DOI
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  // Función para renderizar un ítem general
  function renderGeneralItem(item) {
    const title = item.titulo || item.title || 'Recurso sin título';
    const description = item.descripcion || item.extracto || item.resumen || '';
    const source = item.fuente || item.source || 'Fuente desconocida';
    const url = item.url || '#';
    const thumbnail = item.thumbnail || item.imagen;
    
    return `
      <a class="block p-3 rounded-lg border border-gray-200 hover:shadow hover:border-blue-200 hover:bg-blue-50 transition-colors"
         href="${url}" target="_blank" rel="noopener noreferrer">
        <div class="flex gap-3">
          ${thumbnail ? `<img src="${thumbnail}" class="w-16 h-16 object-cover rounded" alt="${escapeHtml(title)}"/>` : ''}
          <div class="flex-1">
            <h4 class="font-semibold text-blue-700">${escapeHtml(title)}</h4>
            ${description ? `<p class="mt-1 text-sm text-gray-600 line-clamp-2">${escapeHtml(description)}</p>` : ''}
            <span class="inline-block mt-1 text-xs text-gray-400">
              ${escapeHtml(source)}
              ${item.licencia ? ` • ${escapeHtml(item.licencia)}` : ''}
            </span>
          </div>
        </div>
      </a>`;
  }
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
  
  // Añadir estilos para los enlaces de recursos académicos
  const style = document.createElement('style');
  style.textContent = `
    .recursos-academicos {
      margin-top: 1.5rem;
    }
    .recurso-academico {
      border-left: 3px solid #3b82f6;
      transition: all 0.2s ease;
    }
    .recurso-academico:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }
    .recurso-academico .acciones {
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    .recurso-academico:hover .acciones {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
});

// Exponer para que actividad.js pueda refrescar al cambiar de tarea
window.loadRecsFor = loadRecsFor;
