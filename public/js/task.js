// assets/js/tasks.js
(() => {
    // ====== CONFIG ======
    const USE_API = true;              // Cambia a true cuando conectes tu backend
    const API_BASE = "/api/tareas";            // Ajusta si usas /api/tareas, etc.
  
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
    const fmt = (iso) => {
      if (!iso) return "—";
      const d = new Date(iso);
      const t = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${t(d.getMonth()+1)}-${t(d.getDate())} ${t(d.getHours())}:${t(d.getMinutes())}`;
    };
  
    // ====== API LOCAL (localStorage) ======
    const fake = {
      list() {
        const db = JSON.parse(localStorage.getItem("tasks.db") || "[]");
        return db.filter(x => x.course_id === state.courseId);
      },
      create(p) {
        const db = JSON.parse(localStorage.getItem("tasks.db") || "[]");
        const row = { id: crypto.randomUUID(), ...p, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        db.push(row); localStorage.setItem("tasks.db", JSON.stringify(db));
        return row;
      },
      update(id, patch) {
        const db = JSON.parse(localStorage.getItem("tasks.db") || "[]");
        const i = db.findIndex(x => x.id === id); if (i < 0) throw new Error("not-found");
        db[i] = { ...db[i], ...patch, updated_at: new Date().toISOString() };
        localStorage.setItem("tasks.db", JSON.stringify(db));
        return db[i];
      },
      del(id) {
        const db = JSON.parse(localStorage.getItem("tasks.db") || "[]");
        localStorage.setItem("tasks.db", JSON.stringify(db.filter(x => x.id !== id)));
        return true;
      }
    };
  
    // ====== API REAL (cámbialo a tu backend) ======
    async function apiList() {
      if (state.usandoFakeDB) return fake.list();
      const url = new URL(API_BASE, window.location.origin);
      url.searchParams.append('action', 'listar');
      url.searchParams.append('curso_id', state.courseId);
      
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP "+r.status);
      return await r.json();
    }
    async function apiCreate(payload) {
      if (state.usandoFakeDB) return fake.create(payload);
      const url = new URL(API_BASE, window.location.origin);
      url.searchParams.append('action', 'crear');
      
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso_id: payload.course_id,
          titulo: payload.title,
          descripcion: payload.description,
          fecha_limite: payload.due_at,
          puntos: payload.points
        })
      });
      if (!r.ok) throw new Error("HTTP "+r.status);
      const result = await r.json();
      return { ...payload, id: result.id };
    }
    async function apiUpdate(id, patch) {
      if (state.usandoFakeDB) return fake.update(id, patch);
      // Note: The current backend doesn't support updating tasks directly
      // For now, we'll use the fake implementation
      console.warn('Updating tasks is not yet implemented in the backend');
      return fake.update(id, patch);
    }
    async function apiDel(id) {
      if (state.usandoFakeDB) return fake.del(id);
      const url = new URL(API_BASE, window.location.origin);
      url.searchParams.append('action', 'eliminar');
      url.searchParams.append('tarea_id', id);
      
      const r = await fetch(url, { method: 'DELETE' });
      if (!r.ok) throw new Error("HTTP "+r.status);
      return true;
    }
  
    // ====== RENDER ======
    function render() {
      const root = $("#tasks-root"); if (!root) return;
      const lista = $("#listaTareas", root); lista.innerHTML = "";
      const q = state.filtro.q.toLowerCase(), st = state.filtro.status;
  
      const filtradas = state.tareas.filter(t => {
        const okQ = !q || `${t.title} ${t.description}`.toLowerCase().includes(q);
        const okS = !st || t.status === st;
        return okQ && okS;
      }).sort((a,b)=> (a.due_at||"").localeCompare(b.due_at||""));
  
      const tpl = $("#tpl-tarea");
      filtradas.forEach(t => {
        const node = tpl.content.cloneNode(true);
        node.querySelector('[data-field="title"]').textContent = t.title || "(Sin título)";
        node.querySelector('[data-field="description"]').textContent = t.description || "";
        node.querySelector('[data-field="due_at"]').textContent = fmt(t.due_at);
        node.querySelector('[data-field="points"]').textContent = t.points ?? "—";
        node.querySelector('[data-field="status"]').textContent = t.status || "pendiente";
  
        if (state.role === "profesor") {
          const actions = node.querySelector('[data-field="actions"]');
          actions.classList.remove("hidden"); actions.classList.add("flex");
          actions.dataset.id = t.id;
        }
        lista.appendChild(node);
      });
  
      const btn = $("#btnNuevaTarea", root);
      if (state.role === "profesor") btn.classList.remove("hidden"); else btn.classList.add("hidden");
    }
  
    // ====== MODAL ======
    function openModal(data=null) {
      const f = $("#formTarea"); const dlg = $("#modalTarea");
      $("#modalTitulo").textContent = data?.id ? "Editar tarea" : "Nueva tarea";
      f.reset();
      f.id.value = data?.id || "";
      f.title.value = data?.title || "";
      f.description.value = data?.description || "";
      f.due_at.value = data?.due_at ? new Date(data.due_at).toISOString().slice(0,16) : "";
      f.points.value = data?.points ?? 100;
      dlg.showModal();
    }
    const closeModal = () => $("#modalTarea")?.close();
  
    // ====== INIT ======
    async function init() {
      const root = $("#tasks-root"); if (!root) return;
      state.courseId = root.dataset.courseId || new URLSearchParams(location.search).get("courseId") || "demo-course";
      state.role = (root.dataset.role || localStorage.getItem("user.role") || "profesor").toLowerCase();
  
      $("#btnNuevaTarea")?.addEventListener("click", ()=> openModal());
      $("#btnCancelarModal")?.addEventListener("click", closeModal);
      $("#buscarTarea")?.addEventListener("input", e => { state.filtro.q = e.target.value; render(); });
      $("#filtroEstado")?.addEventListener("change", e => { state.filtro.status = e.target.value; render(); });
  
      $("#formTarea")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const payload = {
          course_id: state.courseId,
          title: f.title.value.trim(),
          description: f.description.value.trim(),
          due_at: f.due_at.value ? new Date(f.due_at.value).toISOString() : null,
          points: f.points.value ? Number(f.points.value) : 0,
          status: "pendiente"
        };
        try {
          if (f.id.value) {
            const updated = await apiUpdate(f.id.value, payload);
            const i = state.tareas.findIndex(x => x.id === (updated.id || f.id.value));
            if (i>=0) state.tareas[i] = { ...state.tareas[i], ...updated };
          } else {
            const created = await apiCreate(payload);
            state.tareas.push(created);
          }
          closeModal(); render();
        } catch (err) { alert("No se pudo guardar"); console.error(err); }
      });
  
      $("#listaTareas")?.addEventListener("click", async (e) => {
        const btn = e.target.closest("button"); if (!btn) return;
        const actions = btn.parentElement; const id = actions.dataset.id;
        const t = state.tareas.find(x => x.id === id); if (!t) return;
        try {
          if (btn.dataset.action === "editar") {
            openModal(t);
          } else if (btn.dataset.action === "toggle") {
            const next = t.status === "completada" ? "pendiente" : "completada";
            const up = await apiUpdate(id, { status: next });
            Object.assign(t, up, { status: next }); render();
          } else if (btn.dataset.action === "eliminar") {
            if (confirm("¿Eliminar esta tarea?")) { await apiDel(id); state.tareas = state.tareas.filter(x => x.id !== id); render(); }
          }
        } catch (err) { alert("Acción no realizada"); console.error(err); }
      });
  
      // Cargar
      try { state.tareas = await apiList(); } catch { state.tareas = []; }
      render();
    }
  
    document.addEventListener("DOMContentLoaded", () => { if (document.querySelector("#tasks-root")) init(); });
    window.TasksPage = { init };
  })();
  