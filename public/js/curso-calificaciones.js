// public/js/curso-calificaciones.js
(function () {
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  
    const fmt = {
      date(d) {
        if (!d) return "—";
        const dt = new Date(d);
        return dt.toLocaleString();
      },
      nota(n) {
        if (n === null || n === undefined) return "—";
        const num = Number(n);
        return Number.isFinite(num) ? num.toFixed(2) : "—";
      },
    };
  
    async function fetchJSON(url) {
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) {
        const msg = await r.text().catch(()=>r.statusText);
        throw new Error(`Error ${r.status}: ${msg}`);
      }
      return r.json();
    }
  
    function getCursoId() {
      const params = new URLSearchParams(location.search);
      return params.get("id") || params.get("curso") || params.get("curso_id");
    }
  
    function skeleton() {
      return `
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded-xl"></div>
          <div class="h-32 bg-gray-100 rounded-2xl"></div>
          <div class="h-32 bg-gray-100 rounded-2xl"></div>
        </div>
      `;
    }
  
    function tareaCard(t) {
      // <details> nativo como acordeón por tarea
      const resumen = `
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="font-semibold text-gray-800">${t.titulo}</div>
          <div class="flex items-center gap-3 text-sm">
            <span class="px-2 py-1 rounded-full bg-gray-100">Estudiantes: ${t.total}</span>
            <span class="px-2 py-1 rounded-full bg-emerald-100">Evaluadas: ${t.evaluadas}</span>
            <span class="px-2 py-1 rounded-full bg-amber-100">Pendientes: ${t.pendientes}</span>
            <span class="px-2 py-1 rounded-full bg-sky-100">Promedio: ${fmt.nota(t.promedio)}</span>
            <span class="px-2 py-1 rounded-full bg-gray-100">Cierre: ${fmt.date(t.fecha_limite)}</span>
          </div>
        </div>
      `;
  
      const filas = t.estudiantes.map((e, idx) => `
        <tr class="${idx%2? 'bg-gray-50' : ''}">
          <td class="p-2 truncate">${e.nombre || '—'}</td>
          <td class="p-2 text-center">${fmt.nota(e.calificacion)}</td>
          <td class="p-2">${e.observaciones ? e.observaciones : '—'}</td>
          <td class="p-2 text-center">${fmt.date(e.fecha_entrega)}</td>
          <td class="p-2 text-center">${e.entrega_id ? `<span class="px-2 py-1 rounded-full bg-emerald-100">Entregada</span>` : `<span class="px-2 py-1 rounded-full bg-rose-100">Sin entrega</span>`}</td>
        </tr>
      `).join("");
  
      return `
        <details class="group bg-white border border-emerald-200 rounded-2xl shadow-sm">
          <summary class="cursor-pointer list-none p-4 rounded-2xl hover:bg-emerald-50 transition flex items-center justify-between">
            ${resumen}
          </summary>
          <div class="px-4 pb-4">
            <div class="overflow-auto rounded-xl border border-gray-200">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-100 text-gray-700">
                  <tr>
                    <th class="p-2 text-left">Estudiante</th>
                    <th class="p-2 text-center">Nota</th>
                    <th class="p-2 text-left">Observaciones</th>
                    <th class="p-2 text-center">Fecha entrega</th>
                    <th class="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${filas || `<tr><td class="p-3 text-center text-gray-500" colspan="5">Sin estudiantes</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      `;
    }
  
    function render(data) {
      const cont = $("#calificaciones-panel");
      if (!cont) return;
  
      if (!data.tareas?.length) {
        cont.innerHTML = `
          <div class="p-6 bg-white rounded-2xl border border-emerald-200 text-gray-700">
            No hay tareas en este curso todavía.
          </div>`;
        return;
      }
  
      cont.innerHTML = `
        <div class="space-y-4">
          ${data.tareas.map(tareaCard).join("")}
        </div>
      `;
    }
  
    async function init() {
      const cursoId = getCursoId();
      const panel = $("#calificaciones-panel");
      if (!panel || !cursoId) return;
  
      panel.innerHTML = skeleton();
      try {
        const data = await fetchJSON(`/api/calificaciones?action=listar_por_curso&curso_id=${encodeURIComponent(cursoId)}`);
        render(data);
      } catch (e) {
        console.error(e);
        panel.innerHTML = `
          <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
            Error al cargar calificaciones. ${e.message}
          </div>`;
      }
    }
  
    // si navegas por tabs, puedes llamar init() al activar "Calificaciones".
    document.addEventListener("DOMContentLoaded", init);
  })();
  