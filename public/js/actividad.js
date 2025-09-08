(() => {
  const API_TAREAS = "/api/tareas";
  const API_ENTREGAS = "/api/entregas";
  const API_PERFIL = "/api/perfil";

  const $ = (s, r = document) => r.querySelector(s);
  const parseTS = v => v ? Date.parse(v) : 0;
  const fmt = v => {
    const t = parseTS(v);
    return t ? new Date(t).toLocaleString() : "—";
  };

  const TWO_MB = 2*1024*1024;

  const params = new URLSearchParams(location.search);
  const tareaId = params.get("id");
  const cursoId = params.get("curso");

  if (!tareaId || !cursoId) {
    alert("No se proporcionó ID de tarea o curso");
    location.href = "/mis-cursos.html";
  }

  let tarea = null;
  let perfil = null;
  let entrega = null;
  let role = "estudiante";

  async function cargarDatos() {
    try {
      // Perfil
      const rPerfil = await fetch(API_PERFIL, { credentials: "include" });
      perfil = await rPerfil.json();
      role = perfil.rol === "profesor" || perfil.rol === "admin" ? "profesor" : "estudiante";

      // Tarea
      const rTarea = await fetch(`${API_TAREAS}?action=detalle&tarea_id=${tareaId}`, { credentials: "include" });
      if (!rTarea.ok) throw new Error("No se pudo cargar la tarea");
      tarea = await rTarea.json();

      // Entrega estudiante
      if (role === "estudiante") {
        const rEnt = await fetch(`${API_ENTREGAS}?action=detalle&tarea_id=${tareaId}`, { credentials: "include" });
        if (rEnt.ok) entrega = (await rEnt.json())?.entrega ?? null;
      }

      render();
    } catch (err) {
      console.error(err);
      alert("Error al cargar la actividad");
      location.href = "/mis-cursos.html";
    }
  }

  function render() {
    $("#actividad-title").textContent = tarea.title || "(Sin título)";
    $("#actividad-description").textContent = tarea.description || "";
    $("#actividad-due_at").textContent = fmt(tarea.due_at);
    $("#actividad-points").textContent = Number.isFinite(tarea.points) ? tarea.points : 0;
    $("#actividad-status").textContent = tarea.status || "pendiente";

    // Mostrar botones según rol
    if (role === "profesor") {
      $("#acciones-profesor").classList.remove("hidden");
    } else {
      $("#acciones-estudiante").classList.remove("hidden");
      // Mostrar última entrega si existe
      if (entrega?.archivo_nombre) {
        $("#btnVerEntrega").href = `${API_ENTREGAS}?action=descargar&tarea_id=${tareaId}`;
        $("#btnEntregar").textContent = "Reemplazar entrega";
        $("#btnEliminarEntrega").classList.remove("hidden");
      }
    }
  }

  // Eventos profesor
  $("#btnEditarTarea")?.addEventListener("click", () => {
    alert("Función editar pendiente de implementar"); // Aquí puedes abrir modal para editar
  });
  $("#btnToggleStatus")?.addEventListener("click", async () => {
    const next = tarea.status === "completada" ? "pendiente" : "completada";
    try {
      const r = await fetch(`${API_TAREAS}?action=editar`, {
        method: "PUT",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: tareaId, status: next})
      });
      if (!r.ok) throw new Error("Error al actualizar");
      tarea.status = next;
      render();
    } catch(e){ alert(e.message); }
  });
  $("#btnEliminarTarea")?.addEventListener("click", async () => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      const r = await fetch(`${API_TAREAS}?action=eliminar&tarea_id=${tareaId}&curso_id=${cursoId}`, { method:"DELETE", credentials:"include" });
      if (!r.ok) throw new Error("Error al eliminar");
      alert("Tarea eliminada");
      location.href = `/curso.html?id=${cursoId}`;
    } catch(e){ alert(e.message); }
  });

  // Eventos estudiante
  const modalEntrega = $("#modalEntrega");
  const formEntrega = $("#formEntrega");
  $("#btnEntregar")?.addEventListener("click", () => {
    $("#entrega-tarea_id").value = tareaId;
    formEntrega.reset();
    $("#pesoArchivo").textContent = "—";
    modalEntrega.showModal();
  });
  $("#btnCancelarEntrega")?.addEventListener("click", () => modalEntrega.close());
  formEntrega?.archivo?.addEventListener("change", e => {
    const f = e.target.files[0];
    const p = $("#pesoArchivo");
    if (!f) return p.textContent="—";
    p.textContent = `Tamaño: ${(f.size/1024).toFixed(1)} KB`;
    if (f.size > TWO_MB) { alert("Archivo >2MB"); e.target.value=""; p.textContent="—"; }
  });
  formEntrega?.addEventListener("submit", async e => {
    e.preventDefault();
    const file = formEntrega.archivo.files[0];
    if (!file) return alert("Selecciona archivo");
    if (file.size > TWO_MB) return alert("Archivo >2MB");

    const fd = new FormData();
    fd.append("archivo", file);
    fd.append("tarea_id", tareaId);
    fd.append("curso_id", cursoId);

    try {
      const r = await fetch(`${API_ENTREGAS}?action=subir`, { method:"POST", body: fd, credentials:"include" });
      if (!r.ok) throw new Error("No se pudo subir");
      const data = await r.json();
      entrega = data?.entrega || { tarea_id: Number(tareaId) };
      tarea.status = "completada";
      alert("Entrega registrada ✔");
      modalEntrega.close();
      render();
    } catch(e){ alert(e.message); }
  });

  $("#btnEliminarEntrega")?.addEventListener("click", async () => {
    if (!confirm("¿Eliminar entrega?")) return;
    try {
      const r = await fetch(`${API_ENTREGAS}?action=eliminar&tarea_id=${tareaId}`, { method:"DELETE", credentials:"include" });
      if (!r.ok) throw new Error("No se pudo eliminar entrega");
      entrega = null;
      alert("Entrega eliminada");
      render();
    } catch(e){ alert(e.message); }
  });

  // Inicializar
  cargarDatos();
})();
