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
  };

  const $ = (s, r = document) => r.querySelector(s);
  const withCreds = (opt = {}) => ({ credentials: "include", ...opt });

  const parseTS = (v) => {
    if (!v) return 0;
    const t = typeof v === "string" ? Date.parse(v) : (v?.getTime?.() || v);
    return Number.isFinite(t) ? t : 0;
  };
  const fmt = (v) => {
    const t = parseTS(v);
    if (!t) return "—";
    const d = new Date(t);
    return d.toLocaleString();
  };

  function normalize(row) {
    return {
      id: String(row.id),
      course_id: String(row.curso_id),
      title: row.titulo ?? row.title ?? "",
      description: row.descripcion ?? row.description ?? "",
      due_at: row.fecha_limite ?? row.due_at ?? null,
      points: Number.isFinite(row.puntos) ? row.puntos : (Number(row.points) || 0),
      status: row.estado ?? row.status ?? "pendiente",
      created_at: row.created_at ?? row.fecha_creacion ?? null,
      updated_at: row.updated_at ?? row.fecha_actualizacion ?? null,
    };
  }

  /* ===== API ===== */
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
      url.searchParams.append("action", "obtener-detalle");
      url.searchParams.append("id", id);
      const r = await fetch(url, withCreds());
      if (!r.ok) return null;
      return await r.json(); // { profesor_id, ... }
    } catch { return null; }
  }

  async function apiEntregasList(cursoId) {
    const url = new URL(API_ENTREGAS, location.origin);
    url.searchParams.set("action", "listar");
    url.searchParams.set("curso_id", cursoId);
    const r = await fetch(url, withCreds());
    if (!r.ok) return { entregas: [] };
    return r.json(); // {entregas:[{tarea_id, archivo_nombre, ...}]}
  }

  async function apiEntregaDetalle(tareaId) {
    const url = new URL(API_ENTREGAS, location.origin);
    url.searchParams.set("action", "detalle");
    url.searchParams.set("tarea_id", tareaId);
    const r = await fetch(url, withCreds());
    if (!r.ok) return null;
    return (await r.json())?.entrega ?? null;
  }

  async function apiEntregaEliminar(tareaId) {
    const url = new URL(API_ENTREGAS, location.origin);
    url.searchParams.set("action", "eliminar");
    url.searchParams.set("tarea_id", tareaId);
    const r = await fetch(url, withCreds({ method: "DELETE" }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  async function resolveRoleForCourse(courseId) {
    const perfil = await apiPerfil();
    const curso  = await apiCursoDetalle(courseId);
    const isAdmin     = (perfil?.rol || "").toLowerCase() === "admin";
    const isProfesor  = (perfil?.rol || "").toLowerCase() === "profesor";
    const isOwner     = perfil?.id && curso?.profesor_id && Number(perfil.id) === Number(curso.profesor_id);
    return (isAdmin || isProfesor || isOwner) ? "profesor" : "estudiante";
  }

  async function apiList(course_id) {
    const url = new URL(API_TAREAS, location.origin);
    url.searchParams.append("action", "listar");
    url.searchParams.append("curso_id", course_id);
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
    url.searchParams.append("curso_id", state.courseId);
    const r = await fetch(url, withCreds({ method: "DELETE" }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return true;
  }

  /* ===== Render ===== */
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
      const noTasksModal = `
        <div id="no-tasks-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay tareas disponibles</h3>
            <p class="text-gray-500 mb-6">
              ${state.role === 'profesor' ? 
                'Aún no has creado ninguna tarea para este curso. ¡Crea tu primera tarea ahora!' : 
                'Aún no hay tareas disponibles para este curso. Por favor, revisa más tarde.'}
            </p>
            <div class="flex justify-center">
              ${state.role === 'profesor' ? 
                `<button id="btnCreateFirstTask" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Crear primera tarea</button>` :
                `<button id="closeNoTasksModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cerrar</button>`
              }
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', noTasksModal);

      if (state.role === 'profesor') {
        document.getElementById('btnCreateFirstTask')?.addEventListener('click', () => {
          document.getElementById('no-tasks-modal')?.remove();
          openModal();
        });
      } else {
        document.getElementById('closeNoTasksModal')?.addEventListener('click', () => {
          document.getElementById('no-tasks-modal')?.remove();
        });
      }

      lista.innerHTML = `
        <div class="p-8 text-center text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
          <p class="mt-1 text-sm text-gray-500">${state.role === 'profesor' ? 'Comienza creando una nueva tarea.' : 'Aún no hay tareas disponibles para este curso.'}</p>
        </div>
      `;
    } else {
      const tpl = $("#tpl-tarea");
      filtradas.forEach((t) => {
        const node = tpl.content.cloneNode(true);

        node.querySelector('.actividad-item').dataset.id = t.id;
        node.querySelector('[data-field="title"]').textContent = t.title || "(Sin título)";
        node.querySelector('[data-field="description"]').textContent = t.description || "";
        node.querySelector('[data-field="due_at"]').textContent = fmt(t.due_at);
        node.querySelector('[data-field="points"]').textContent = Number.isFinite(t.points) ? t.points : 0;
        node.querySelector('[data-field="status"]').textContent = t.status || "pendiente";

        const actions = node.querySelector('[data-field="actions"]');
        if (actions) {
          const isProf = state.role === "profesor";
          actions.classList.toggle("hidden", !isProf);
          actions.classList.toggle("flex", isProf);
          actions.dataset.id = t.id;
        }

        const sActions = node.querySelector('[data-field="student-actions"]');
        if (sActions) {
          const isEst = state.role === "estudiante";
          sActions.classList.toggle("hidden", !isEst);
          sActions.classList.toggle("flex", isEst);
          sActions.dataset.id = t.id;
          const ver = sActions.querySelector('[data-action="ver"]');
          if (ver) ver.href = `${API_ENTREGAS}?action=descargar&tarea_id=${t.id}`;
          const btnEntregar = sActions.querySelector('[data-action="entregar"]');
          const btnEliminarE = sActions.querySelector('[data-action="eliminar-entrega"]');
          const tiene = !!t._entrega;
          if (btnEntregar) btnEntregar.textContent = tiene ? "Reemplazar entrega" : "Entregar";
          if (btnEliminarE) btnEliminarE.classList.toggle("hidden", !tiene);
        }

        lista.appendChild(node);
      });
    }

    $("#btnNuevaTarea")?.classList.toggle("hidden", state.role !== "profesor");

    // Delegar clic en actividad para detalle
    root.querySelectorAll('.actividad-item').forEach(item => {
      item.addEventListener('click', () => {
        const actividadId = item.dataset.id;
        window.location.href = `/views/actividad.html?id=${actividadId}&curso=${state.courseId}`;
      });
    });
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

  /* ===== Entrega (estudiante) ===== */
  const TWO_MB = 2 * 1024 * 1024;
  function openEntrega(tareaId) {
    const dlg = $("#modalEntrega");
    const f = $("#formEntrega");
    f.reset();
    f.tarea_id.value = tareaId;
    if (f.curso_id) f.curso_id.value = state.courseId;
    $("#pesoArchivo").textContent = "—";
    const $actual = $("#archivoActual");
    if ($actual) $actual.textContent = "—";
    apiEntregaDetalle(tareaId).then(e => {
      if (e?.archivo_nombre && $actual) $actual.textContent = e.archivo_nombre;
    }).catch(()=>{});
    dlg.showModal();
  }
  const closeEntrega = () => $("#modalEntrega")?.close();

  $("#btnCancelarEntrega")?.addEventListener("click", closeEntrega);
  $("#formEntrega [name='archivo']")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    const p = $("#pesoArchivo");
    if (!f) { p.textContent = "—"; return; }
    p.textContent = `Tamaño: ${(f.size/1024).toFixed(1)} KB`;
    if (f.size > TWO_MB) {
      alert("El archivo supera 2 MB.");
      e.target.value = "";
      p.textContent = "—";
    }
  });

  $("#formEntrega")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const file = f.archivo.files?.[0];
    if (!file) return alert("Selecciona un archivo");
    if (file.size > TWO_MB) return alert("El archivo supera 2 MB");

    const fd = new FormData();
    fd.append("archivo", file);
    fd.append("tarea_id", f.tarea_id.value);
    if (state.courseId) fd.append("curso_id", state.courseId);

    try {
      const url = new URL(API_ENTREGAS, location.origin);
      url.searchParams.append("action", "subir");
      const resp = await fetch(url, { method: "POST", body: fd, credentials: "include" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
      const tId = String(f.tarea_id.value);
      const idx = state.tareas.findIndex(x => String(x.id) === tId);
      if (idx >= 0) {
        state.tareas[idx].status = "completada";
        state.tareas[idx]._entrega = data?.entrega || { tarea_id: Number(tId) };
      }
      alert("Entrega registrada ✔");
      closeEntrega();
      render();
    } catch (err) {
      console.error(err);
      alert("No se pudo subir la entrega: " + err.message);
    }
  });

  async function init() {
    const root = $("#tasks-root");
    if (!root) return;

    const qs = new URLSearchParams(location.search);
    state.courseId = root.dataset.courseId || qs.get("id") || qs.get("courseId") || qs.get("curso_id") || null;
    if (!state.courseId) { console.warn('Falta courseId para tareas'); }

    state.role = await resolveRoleForCourse(state.courseId);

    /* Eventos UI */
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
          const id = f.id.value;
          const updated = await apiUpdate(id, { id, ...payload });
          const i = state.tareas.findIndex(x => x.id === String(id));
          if (i >= 0) state.tareas[i] = { ...state.tareas[i], ...updated };
        } else {
          const created = await apiCreate(payload);
          state.tareas.push(created);
        }
        closeModal();
        render();
      } catch (err) {
        console.error(err); alert("No se pudo guardar");
      }
    });

    /* Delegación de acciones */
    document.querySelector('#listaTareas')?.addEventListener('click', async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const actions = btn.closest('[data-field="actions"], [data-field="student-actions"]');
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
        } else if (btn.dataset.action === "entregar") {
          if (state.role !== "estudiante") return;
          openEntrega(t.id);
        } else if (btn.dataset.action === "eliminar-entrega") {
          if (state.role !== "estudiante") return;
          if (!confirm("¿Eliminar tu entrega?")) return;
          await apiEntregaEliminar(t.id);
          t.status = "pendiente";
          delete t._entrega;
          render();
        }
      } catch (err) {
        console.error(err); alert("Acción no realizada");
      }
    });

    /* Cargar tareas */
    try {
      state.tareas = await apiList(state.courseId);
    } catch (err) {
      console.error(err);
      root.innerHTML = `
        <div class="p-6 text-red-700 bg-red-50 rounded-xl border border-red-200">
          Error cargando tareas. Revisa tu API.
          <div class="mt-1"><code class="text-xs">/api/tareas?action=listar&curso_id=${state.courseId ?? "?"}</code></div>
        </div>`;
      return;
    }

    /* Hidratar entregas del estudiante */
    try {
      if (state.role === "estudiante" && state.courseId) {
        const { entregas } = await apiEntregasList(state.courseId);
        const mapa = new Map((entregas || []).map(e => [String(e.tarea_id), e]));
        state.tareas = state.tareas.map(t => {
          const e = mapa.get(String(t.id));
          if (e) { t.status = "completada"; t._entrega = e; }
          return t;
        });
      }
    } catch {}

    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#tasks-root")) init();
  });

  window.TasksPage = { init };
  window.openEntrega = openEntrega;
})();
