// assets/js/tasks.js
(() => {
  // ====== CONFIG ======
  const USE_API = true;
  const API_BASE = "/api/tareas";

  // ====== ESTADO ======
  const state = {
    courseId: null,
    role: "estudiante",
    tareas: [],
    filtro: { q: "", status: "" },
    usandoFakeDB: !USE_API,
  };

  // ====== HELPERS ======
  const $ = (s, r = document) => r.querySelector(s);

  const toISOorNull = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d) ? null : d.toISOString();
  };

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
    id: String(r?.id ?? r?.tarea_id ?? r?.uuid ?? ""),
    course_id: r?.curso_id ?? r?.course_id ?? state.courseId,
    title: r?.title ?? r?.titulo ?? "(Sin título)",
    description: r?.description ?? r?.descripcion ?? "",
    due_at: r?.due_at ?? r?.fecha_limite ?? null,
    points: Number(r?.points ?? r?.puntos ?? 0),
    status: r?.status ?? r?.estado ?? "pendiente",
    created_at: r?.created_at ?? r?.fecha_creacion ?? null,
    updated_at: r?.updated_at ?? r?.fecha_actualizacion ?? r?.updatedAt ?? null,
  });

  const withCreds = (opt = {}) => ({ credentials: "include", ...opt });

  // ====== API ======
  async function apiList() {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.append("action", "listar");
    url.searchParams.append("curso_id", state.courseId);

    const r = await fetch(url, withCreds());
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    return Array.isArray(data) ? data.map(normalize) : [];
  }

  async function apiCreate(payload) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.append("action", "crear");

    const body = {
      curso_id: payload.course_id,
      titulo: payload.title || null,
      descripcion: payload.description || null,
      fecha_limite: payload.due_at,
      puntos: payload.points ?? 0,
    };

    const r = await fetch(url, withCreds({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    const result = await r.json();
    return normalize({
      id: result?.id,
      curso_id: body.curso_id,
      titulo: body.titulo,
      descripcion: body.descripcion,
      fecha_limite: body.fecha_limite,
      puntos: body.puntos,
      estado: "pendiente",
    });
  }

  async function apiUpdate(id, patch) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.append("action", "editar");
    const body = {
      id,
      curso_id: patch.course_id ?? state.courseId,
      titulo: patch.title,
      descripcion: patch.description,
      fecha_limite: patch.due_at,
      puntos: patch.points,
      estado: patch.status,
    };
    const r = await fetch(url, withCreds({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return { id, ...patch };
  }

  async function apiDel(id) {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.append("action", "eliminar");
    url.searchParams.append("tarea_id", id);
    const r = await fetch(url, withCreds({ method: "DELETE" }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return true;
  }

  // ====== RENDER ======
  function render() {
    const root = $("#tasks-root");
    if (!root) return;

    const lista = $("#listaTareas", root);
    lista.innerHTML = "";
    const q = state.filtro.q.toLowerCase();
    const st = state.filtro.status;

    const filtradas = state.tareas
      .filter((t) => {
        const okQ = !q || `${t.title} ${t.description}`.toLowerCase().includes(q);
        const okS = !st || t.status === st;
        return okQ && okS;
      })
      .sort((a, b) => parseTS(a.due_at) - parseTS(b.due_at));

    if (!filtradas.length) {
      lista.innerHTML = `<div class="p-6 text-gray-500">No hay tareas para este curso.</div>`;
      const btn = $("#btnNuevaTarea", root);
      if (btn) btn.classList.toggle("hidden", state.role !== "profesor");
      return;
    }

    const tpl = $("#tpl-tarea");
    filtradas.forEach((t) => {
      const node = tpl.content.cloneNode(true);
      node.querySelector('[data-field="title"]').textContent = t.title || "(Sin título)";
      node.querySelector('[data-field="description"]').textContent = t.description || "";
      node.querySelector('[data-field="due_at"]').textContent = fmt(t.due_at);
      node.querySelector('[data-field="points"]').textContent = Number.isFinite(t.points) ? t.points : 0;
      node.querySelector('[data-field="status"]').textContent = t.status || "pendiente";

      const actions = node.querySelector('[data-field="actions"]');
      if (state.role === "profesor") {
        actions.classList.remove("hidden");
        actions.classList.add("flex");
        actions.dataset.id = t.id;
      } else {
        actions.classList.add("hidden");
        actions.classList.remove("flex");
      }
      lista.appendChild(node);
    });

    const btn = $("#btnNuevaTarea", root);
    if (btn) btn.classList.toggle("hidden", state.role !== "profesor");
  }

  // ====== MODAL ======
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

  // ====== INIT ======
  async function init() {
    const root = $("#tasks-root");
    if (!root) return;

    const qs = new URLSearchParams(location.search);
    state.courseId = root.dataset.courseId || qs.get("id") || qs.get("courseId") || qs.get("curso_id") || null;

    // Rol: intenta /api/perfil; si falla usa data-attr o localStorage
    try {
      const rp = await fetch("/api/perfil", withCreds());
      if (rp.ok) {
        const perfil = await rp.json();
        state.role = String(perfil?.rol || "estudiante").toLowerCase();
      } else {
        state.role = (root.dataset.role || localStorage.getItem("user.role") || "estudiante").toLowerCase();
      }
    } catch {
      state.role = (root.dataset.role || localStorage.getItem("user.role") || "estudiante").toLowerCase();
    }

    $("#btnNuevaTarea")?.addEventListener("click", () => openModal());
    $("#btnCancelarModal")?.addEventListener("click", closeModal);
    $("#buscarTarea")?.addEventListener("input", (e) => { state.filtro.q = e.target.value; render(); });
    $("#filtroEstado")?.addEventListener("change", (e) => { state.filtro.status = e.target.value; render(); });

    $("#formTarea")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const payload = {
        course_id: state.courseId,
        title: f.title.value.trim(),
        description: f.description.value.trim(),
        due_at: f.due_at.value ? toISOorNull(f.due_at.value) : null,
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
        closeModal();
        render();
      } catch (err) {
        alert("No se pudo guardar");
        console.error(err);
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
          openModal(t);
        } else if (btn.dataset.action === "toggle") {
          const next = t.status === "completada" ? "pendiente" : "completada";
          await apiUpdate(id, { status: next, course_id: t.course_id });
          t.status = next;
          render();
        } else if (btn.dataset.action === "eliminar") {
          if (confirm("¿Eliminar esta tarea?")) {
            await apiDel(id);
            state.tareas = state.tareas.filter((x) => x.id !== id);
            render();
          }
        }
      } catch (err) {
        alert("Acción no realizada");
        console.error(err);
      }
    });

    // Cargar lista con manejo de errores visible
    try {
      state.tareas = await apiList();
      if (!Array.isArray(state.tareas)) state.tareas = [];
    } catch (e) {
      console.error("Fallo al listar tareas:", e);
      const box = document.getElementById("listaTareas");
      if (box) {
        box.innerHTML = `
          <div class="p-4 rounded bg-red-50 border border-red-200 text-red-700">
            No se pudieron cargar las tareas. Revisa el backend o recarga.<br>
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
