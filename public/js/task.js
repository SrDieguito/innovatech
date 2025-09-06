// assets/js/tasks.js
(() => {
  const API_TAREAS = "/api/tareas";
  const API_CURSOS = "/api/cursos";
  const API_PERFIL = "/api/perfil";
  const API_ENTREGAS = "/api/entregas";

  const state = {
    courseId: null,
    role: "estudiante", // 'profesor' si es dueño/profesor/admin
    tareas: [],
    filtro: { q: "", status: "" },
    entregasMap: {},      // { [tarea_id]: {entrega_id, entregado, fecha, calificacion, estado} }
    currentTareaId: null, // para saber a qué tarea se le entrega o se consultan entregas
  };

  const $ = (s, r = document) => r.querySelector(s);
  const withCreds = (opt = {}) => ({ credentials: "include", ...opt });

  const parseTS = (v) => {
    if (!v) return 0;
    const fixed = typeof v === "string" && v.includes(" ") && !v.includes("T")
      ? v.replace(" ", "T")
      : v;
    const t = Date.parse(fixed);
    return isNaN(t) ? 0 : t;
  };

  const fmt = (iso) => {
    if (!iso) return "—";
    const t = parseTS(iso);
    if (!t) return "—";
    const d = new Date(t);
    const two = (n) => String(n).padStart(2, "0");
    return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
  };

  const normalize = (r) => ({
    id: String(r?.id ?? ""),
    course_id: r?.curso_id ?? state.courseId,
    title: r?.title ?? r?.titulo ?? "(Sin título)",
    description: r?.description ?? r?.descripcion ?? "",
    due_at: r?.due_at ?? r?.fecha_limite ?? null,
    points: Number(r?.points ?? r?.puntos ?? 0),
    status: r?.status ?? r?.estado ?? "pendiente",
    created_at: r?.created_at ?? r?.fecha_creacion ?? null,
    updated_at: r?.updated_at ?? r?.fecha_actualizacion ?? null,
  });

  async function apiPerfil() {
    try {
      const r = await fetch(API_PERFIL, withCreds());
      if (!r.ok) return null;
      return await r.json(); // { id, nombre, rol }
    } catch { return null; }
  }

  async function apiCursoDetalle(id) {
    try {
      const url = new URL(API_CURSOS, location.origin);
      url.searchParams.append("action", "detalle");
      url.searchParams.append("id", id);
      const r = await fetch(url, withCreds());
      if (!r.ok) return null;
      return await r.json(); // { profesor_id, ... }
    } catch { return null; }
  }

  // Resuelve rol: profesor si (perfil.rol==='profesor' || 'admin') o si perfil.id == profesor_id del curso
  async function resolveRoleForCourse(courseId) {
    const perfil = await apiPerfil();
    const curso  = await apiCursoDetalle(courseId);

    const isAdmin     = (perfil?.rol || "").toLowerCase() === "admin";
    const isProfesor  = (perfil?.rol || "").toLowerCase() === "profesor";
    const isOwner     = perfil?.id && curso?.profesor_id && Number(perfil.id) === Number(curso.profesor_id);

    const role = (isAdmin || isProfesor || isOwner) ? "profesor" : "estudiante";
    // DEBUG opcional
    console.log("[role]", { perfil, curso, role, isAdmin, isProfesor, isOwner });
    return role;
  }

  async function apiList() {
    const url = new URL(API_TAREAS, location.origin);
    url.searchParams.append("action", "listar");
    url.searchParams.append("curso_id", state.courseId);
    const r = await fetch(url, withCreds());
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    return Array.isArray(data) ? data.map(normalize) : [];
  }

  async function apiCreate(payload) {
    const url = new URL(API_TAREAS, location.origin);
    url.searchParams.append("action", "crear");
    const r = await fetch(url, withCreds({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        curso_id: payload.course_id,
        titulo: payload.title || null,
        descripcion: payload.description || null,
        fecha_limite: payload.due_at || null,
        puntos: payload.points ?? 0,
      }),
    }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    const result = await r.json();
    return normalize({
      id: result?.id,
      curso_id: payload.course_id,
      titulo: payload.title,
      descripcion: payload.description,
      fecha_limite: payload.due_at,
      puntos: payload.points,
      estado: "pendiente",
    });
  }

  async function apiUpdate(id, patch) {
    const url = new URL(API_TAREAS, location.origin);
    url.searchParams.append("action", "editar");
    const r = await fetch(url, withCreds({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        curso_id: patch.course_id ?? state.courseId,
        titulo: patch.title,
        descripcion: patch.description,
        fecha_limite: patch.due_at,
        puntos: patch.points,
        estado: patch.status,
      }),
    }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return { id, ...patch };
  }

  async function apiDel(id) {
    const url = new URL(API_TAREAS, location.origin);
    url.searchParams.append("action", "eliminar");
    url.searchParams.append("tarea_id", id);
    const r = await fetch(url, withCreds({ method: "DELETE" }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return true;
  }
  async function apiMisEntregas(){
    const url = new URL(API_ENTREGAS, location.origin);
    url.searchParams.append('action','mis');
    url.searchParams.append('curso_id', state.courseId);
    const r = await fetch(url, withCreds());
    if (!r.ok) return {};
    return await r.json(); // { [tarea_id]: {...} }
  }
  
  async function apiEntregasPorTarea(tareaId){
    const url = new URL(API_ENTREGAS, location.origin);
    url.searchParams.append('action','por_tarea');
    url.searchParams.append('tarea_id', tareaId);
    const r = await fetch(url, withCreds());
    if (!r.ok) throw new Error('HTTP '+r.status);
    return await r.json(); // array de entregas
  }
  
  async function apiSubirEntrega(tareaId, file){
    const fd = new FormData();
    fd.append('tarea_id', tareaId);
    fd.append('archivo', file); // máx. 2MB validado en backend
    const url = new URL(API_ENTREGAS, location.origin);
    url.searchParams.append('action','subir');
    const r = await fetch(url, withCreds({ method:'POST', body: fd }));
    if (r.status === 413) throw new Error('Archivo supera 2MB');
    if (!r.ok) throw new Error('HTTP '+r.status);
    return await r.json();
  }
  
  async function apiCalificarEntrega(id, calificacion, observacion){
    const url = new URL(API_ENTREGAS, location.origin);
    url.searchParams.append('action','calificar');
    const r = await fetch(url, withCreds({
      method:'PUT',
      headers:{ 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, calificacion, observacion })
    }));
    if (!r.ok) throw new Error('HTTP '+r.status);
    return await r.json();
  }
  
  function render() {
    const root = $("#tasks-root");
    if (!root) return;
    const lista = $("#listaTareas", root);
    lista.innerHTML = "";

    const q = state.filtro.q.toLowerCase();
    const st = state.filtro.status;

    const filtradas = state.tareas
      .filter(t => (!q || `${t.title} ${t.description}`.toLowerCase().includes(q)) && (!st || t.status === st))
      .sort((a, b) => parseTS(a.due_at) - parseTS(b.due_at));

    if (!filtradas.length) {
      lista.innerHTML = `<div class="p-6 text-gray-500">No hay tareas para este curso.</div>`;
    } else {
      const tpl = $("#tpl-tarea");

      filtradas.forEach((t) => {

        const node = tpl.content.cloneNode(true);
        node.querySelector('[data-field="title"]').textContent = t.title || "(Sin título)";
        node.querySelector('[data-field="description"]').textContent = t.description || "";
        node.querySelector('[data-field="due_at"]').textContent = fmt(t.due_at);
        node.querySelector('[data-field="points"]').textContent = Number.isFinite(t.points) ? t.points : 0;
        node.querySelector('[data-field="status"]').textContent = t.status || "pendiente";

        const actions = node.querySelector('[data-field="actions"]');

        if (actions) {

          // ➕ NUEVO: Acciones para estudiante (botón Entregar + badge “Entregado”)
          const actionsStudent = node.querySelector('[data-field="actions-student"]');
          if (actionsStudent) {
            const isStudent = state.role !== "profesor";
            actionsStudent.classList.toggle('hidden', !isStudent);
            actionsStudent.dataset.id = t.id;

            const my = state.entregasMap[t.id];
            const badge = node.querySelector('[data-field="my-delivery"]');
            if (isStudent && my?.entregado) {
              badge?.classList.remove('hidden');
              if (badge) badge.textContent = `Entregado (${fmt(my.fecha)})`;
            } else {
              badge?.classList.add('hidden');
            }

            // evento botón Entregar
            const btnEnt = node.querySelector('[data-action="entregar"]');
            if (btnEnt) {
              btnEnt.addEventListener('click', ()=>{
                state.currentTareaId = t.id;
                openEntregaModal(t.title);
              });
            }
          }

          // ➕ NUEVO: botón “Ver entregas” para profesor
          const btnVer = node.querySelector('[data-action="ver-entregas"]');
          if (btnVer) {
            const isProf = state.role === 'profesor';
            btnVer.classList.toggle('hidden', !isProf);
            btnVer.addEventListener('click', async ()=>{
              state.currentTareaId = t.id;
              await openProfesorModal(t.id, t.title);
            });
          }
          

        }

        lista.appendChild(node);
      });
    }

    $("#btnNuevaTarea")?.classList.toggle("hidden", state.role !== "profesor");
  }

  function openModal(data = null) {
    const f = $("#formTarea");
    const dlg = $("#modalTarea");
    $("#modalTitulo").textContent = data?.id ? "Editar tarea" : "Nueva tarea";
    f.reset();
    f.id.value = data?.id || "";
    f.title.value = data?.title || "";
    f.description.value = data?.description || "";
    f.due_at.value = data?.due_at ? new Date(parseTS(data.due_at)).toISOString().slice(0, 16) : "";
    f.points.value = Number.isFinite(data?.points) ? data.points : 100;
    dlg.showModal();
  }
  const closeModal = () => $("#modalTarea")?.close();


  // === Modal de entrega (estudiante)
function openEntregaModal(title){
  document.getElementById('entregaTitulo').textContent = title || 'Entregar tarea';
  document.getElementById('inputArchivo').value = '';
  document.getElementById('msgEntrega').textContent = '';
  document.getElementById('modalEntrega').showModal();
}
function closeEntregaModal(){ document.getElementById('modalEntrega')?.close(); }

// === Modal de lista de entregas (profesor)
async function openProfesorModal(tareaId, title){
  document.getElementById('profTitulo').textContent = `Entregas: ${title||''}`;
  const list = document.getElementById('profLista');
  list.innerHTML = '<div class="p-3 text-gray-500">Cargando...</div>';
  try{
    const data = await apiEntregasPorTarea(tareaId);
    if (!data.length) {
      list.innerHTML = '<div class="p-3 text-gray-500">Sin entregas aún.</div>';
    } else {
      list.innerHTML = '';
      data.forEach(e=>{
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between border-b py-2 gap-3';
        row.innerHTML = `
          <div class="min-w-0">
            <div class="font-medium truncate">${e.estudiante}</div>
            <div class="text-xs text-gray-500 truncate">${e.archivo_nombre} • ${Math.round(e.tamano_bytes/1024)} KB • ${fmt(e.fecha_entrega)}</div>
            <div class="text-xs">${e.estado}${e.calificacion!=null?` • Nota: ${e.calificacion}`:''}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a class="px-2 py-1 border rounded text-sm" href="/api/entregas?action=descargar&id=${e.id}">Descargar</a>
            <input type="number" min="0" max="100" step="1" placeholder="Nota" class="w-20 px-2 py-1 border rounded text-sm" value="${e.calificacion??''}" data-calificar-id="${e.id}">
            <button class="px-2 py-1 border rounded text-sm bg-green-600 text-white" data-guardar-id="${e.id}">Guardar</button>
          </div>`;
        list.appendChild(row);
      });
      list.querySelectorAll('[data-guardar-id]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const id = btn.getAttribute('data-guardar-id');
          const inp = list.querySelector(`[data-calificar-id="${id}"]`);
          try{
            await apiCalificarEntrega(Number(id), inp.value? Number(inp.value): null, null);
            btn.textContent = 'Guardado';
            setTimeout(()=> btn.textContent='Guardar', 1200);
          }catch(e){ alert('No se pudo guardar'); console.error(e); }
        });
      });
    }
  }catch(e){
    list.innerHTML = '<div class="p-3 text-red-600 bg-red-50 border border-red-200 rounded">Error al cargar entregas.</div>';
  }
  document.getElementById('modalProfesor').showModal();
}
function closeProfesorModal(){ document.getElementById('modalProfesor')?.close(); }



  async function init() {
    const root = $("#tasks-root");
    if (!root) return;

    const qs = new URLSearchParams(location.search);
    state.courseId = root.dataset.courseId || qs.get("id") || qs.get("courseId") || qs.get("curso_id") || null;

    // 1) Resolver rol (perfil.rol || dueño || admin)
    state.role = await resolveRoleForCourse(state.courseId);
    // Eventos de modales de entrega
    document.getElementById('btnSubirArchivo')?.addEventListener('click', async ()=>{
      const file = document.getElementById('inputArchivo').files[0];
      const msg = document.getElementById('msgEntrega');
      if (!file) { msg.textContent = 'Selecciona un archivo.'; return; }
      if (file.size > 2*1024*1024) { msg.textContent = 'Archivo supera 2 MB.'; return; }
      try{
        await apiSubirEntrega(state.currentTareaId, file);
        msg.textContent = 'Entregado ✔';
        state.entregasMap = await apiMisEntregas(); // refresca mi estado
        setTimeout(()=> { closeEntregaModal(); render(); }, 700);
      }catch(e){ msg.textContent = 'Error al entregar.'; console.error(e); }
    });
    document.getElementById('btnCancelarEntrega')?.addEventListener('click', closeEntregaModal);
    document.getElementById('btnCerrarProfesor')?.addEventListener('click', closeProfesorModal);

    // … ya cargas las tareas:
    state.tareas = await apiList();

    // ➕ si NO eres profesor, carga mi mapa de entregas (para mostrar “Entregado”)
    if (state.role !== 'profesor') {
      state.entregasMap = await apiMisEntregas();
    }
    // 2) Eventos UI
    $("#btnNuevaTarea")?.addEventListener("click", () => openModal());
    $("#btnCancelarModal")?.addEventListener("click", closeModal);
    $("#buscarTarea")?.addEventListener("input", (e) => { state.filtro.q = e.target.value; render(); });
    $("#filtroEstado")?.addEventListener("change", (e) => { state.filtro.status = e.target.value; render(); });

    $("#formTarea")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (state.role !== "profesor") return alert("Solo el profesor puede crear/editar tareas.");

      const f = e.target;
      const payload = {
        course_id: state.courseId,
        title: f.title.value.trim(),
        description: f.description.value.trim(),
        due_at: f.due_at.value ? new Date(f.due_at.value).toISOString() : null,
        points: f.points.value ? Number(f.points.value) : 0,
        status: "pendiente",
      };
      try {
        if (f.id.value) {
          const updated = await apiUpdate(f.id.value, payload);
          const i = state.tareas.findIndex((x) => x.id === (updated.id || f.id.value));
          if (i >= 0) state.tareas[i] = { ...state.tareas[i], ...updated };
        } else {
          const created = await apiCreate(payload);
          state.tareas.push(created);
        }
        closeModal(); render();
      } catch (err) {
        console.error(err); alert("No se pudo guardar");
      }
    });

    $("#listaTareas")?.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const actions = btn.closest('[data-field="actions"]');
      const id = actions?.dataset?.id;
      const t = state.tareas.find((x) => x.id === id);
      if (!t) return;

      try {
        if (btn.dataset.action === "editar") {
          if (state.role !== "profesor") return;
          openModal(t);
        } else if (btn.dataset.action === "toggle") {
          if (state.role !== "profesor") return;
          const next = t.status === "completada" ? "pendiente" : "completada";
          await apiUpdate(id, { status: next, course_id: t.course_id });
          t.status = next; render();
        } else if (btn.dataset.action === "eliminar") {
          if (state.role !== "profesor") return;
          if (confirm("¿Eliminar esta tarea?")) {
            await apiDel(id);
            state.tareas = state.tareas.filter((x) => x.id !== id);
            render();
          }
        }
      } catch (err) {
        console.error(err); alert("Acción no realizada");
      }
    });

    // 3) Cargar tareas
    try {
      state.tareas = await apiList();
    } catch (e) {
      console.error("Fallo al listar tareas:", e);
      const box = $("#listaTareas");
      if (box) {
        box.innerHTML = `
          <div class="p-4 rounded bg-red-50 border border-red-200 text-red-700">
            No se pudieron cargar las tareas. Revisa el backend.<br>
            <code class="text-xs">/api/tareas?action=listar&curso_id=${state.courseId ?? "?"}</code>
          </div>`;
      }
      return;
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#tasks-root")) init();
  });
  window.TasksPage = { init };
})();
