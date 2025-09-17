/**
 * Módulo de recomendaciones para la página de actividad
 * Muestra recomendaciones para estudiantes en la entrega de tareas
 */

export async function getRecomendaciones({ tareaId, cursoId }) {
  const url = `/api/recomendaciones?tareaId=${encodeURIComponent(tareaId)}&cursoId=${encodeURIComponent(cursoId||'')}`;
  const r = await fetch(url, { credentials:'include' });
  if (!r.ok) throw new Error('HTTP '+r.status);
  const data = await r.json();
  return data.items || [];
}

export async function initActividadRecomendaciones() {
  try {
    const sp = new URLSearchParams(location.search);
    const tareaId = Number(sp.get('tareaId') || sp.get('tarea_id'));
    const cursoId = Number(sp.get('cursoId') || sp.get('curso_id'));
    if (!tareaId) return;

    const items = await getRecomendaciones({ tareaId, cursoId });
    renderRecs(items);
  } catch (e) {
    console.error('Error al inicializar recomendaciones:', e);
    renderRecs([]); // no romper la vista
  }
}

function renderRecs(items) {
  const cont = document.getElementById('lista-recomendaciones');
  if (!cont) return;
  if (!items.length) {
    cont.innerHTML = `<div class="text-sm text-gray-500">No se encontraron recursos por ahora.</div>`;
    return;
  }
  cont.innerHTML = items.map(it=>`
    <a href="${it.url}" target="_blank" rel="noopener"
       class="block p-3 mb-2 rounded-lg border hover:bg-gray-50 transition">
      <div class="font-medium">${it.titulo}</div>
      <div class="text-sm text-gray-600">${it.snippet||''}</div>
      <div class="mt-1 text-xs text-gray-400">${it.source||''}</div>
    </a>
  `).join('');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initActividadRecomendaciones();
  
  // Mantener la funcionalidad de mostrar/ocultar si existe
  const recomendacionesSection = document.getElementById('recomendaciones-estudiante');
  const btnOcultarRecomendaciones = document.getElementById('btn-ocultar-recomendaciones');
  const btnMostrarRecomendaciones = document.getElementById('btn-mostrar-recomendaciones');

  if (btnOcultarRecomendaciones && recomendacionesSection) {
    btnOcultarRecomendaciones.addEventListener('click', () => {
      recomendacionesSection.classList.add('hidden');
      localStorage.setItem('recomendaciones-visible', 'false');
    });
  }

  if (btnMostrarRecomendaciones && recomendacionesSection) {
    btnMostrarRecomendaciones.addEventListener('click', (e) => {
      e.preventDefault();
      recomendacionesSection.classList.remove('hidden');
      localStorage.setItem('recomendaciones-visible', 'true');
    });
  }

  // Mostrar recomendaciones por defecto si no hay preferencia guardada
  if (recomendacionesSection) {
    const recomendacionesGuardadas = localStorage.getItem('recomendaciones-visible');
    if (recomendacionesGuardadas === null || recomendacionesGuardadas === 'true') {
      recomendacionesSection.classList.remove('hidden');
    }
  }
});
