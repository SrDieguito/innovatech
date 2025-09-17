let lastKey = '';

async function apiRecs({ tareaId, cursoId }) {
  const url = `/api/recomendaciones?tareaId=${encodeURIComponent(tareaId)}&cursoId=${encodeURIComponent(cursoId||'')}`;
  const r = await fetch(url, { credentials:'include' });
  if (!r.ok) throw new Error('HTTP '+r.status);
  const data = await r.json();
  return data.items || [];
}

export async function loadRecsFor(tareaId, cursoId) {
  const key = `${tareaId}|${cursoId}`;
  if (!tareaId || key === lastKey) return;
  lastKey = key;

  const cont = document.getElementById('lista-recomendaciones');
  if (!cont) return;
  cont.innerHTML = `<div class="text-sm text-gray-500">Buscando recursos…</div>`;

  try {
    const items = await apiRecs({ tareaId, cursoId });
    renderRecs(items);
  } catch (e) {
    console.error('Error en recomendaciones:', e);
    renderRecs([]);
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
