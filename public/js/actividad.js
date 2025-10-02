
// Cargar el header
fetch('/views/header.html')
  .then(res => res.text())
  .then(html => {
    const container = document.getElementById('header-container');
    container.innerHTML = html;

    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      if (oldScript.src) newScript.src = oldScript.src;
      else newScript.textContent = oldScript.textContent;
      document.body.appendChild(newScript);
      oldScript.remove();
    });
  });

const params = new URLSearchParams(window.location.search);
const cursoId = params.get("curso") || params.get("courseId") || params.get("curso_id");
const tareaId = params.get("id") || params.get("tarea_id");

const holder = {
  title: document.getElementById('actividad-title'),
  desc: document.getElementById('actividad-description'),
  createdAt: document.getElementById('actividad-created_at'),
  dueAt: document.getElementById('actividad-due_at'),
  status: document.getElementById('actividad-status'),
  points: document.getElementById('actividad-points'),
  profesor: document.getElementById('actividad-profesor'),
  calificacion: document.getElementById('actividad-calificacion'),
  botones: document.getElementById('actividad-buttons'),
  comentarios: document.getElementById('comentarios-list'),
  ultimaEntrega: document.getElementById('actividad-ultima-entrega'),
  preview: document.getElementById('previewContent'),
  archivoActual: document.getElementById('archivoActual'),
  entregasCount: document.getElementById('entregas-count')
};

// Variables para el modal de confirmación
let confirmacionCallback = null;

// Función para mostrar notificación toast
function showToast(message, isSuccess = true) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  toastMessage.textContent = message;
  
  // Cambiar color según el tipo de mensaje
  if (isSuccess) {
    toast.classList.remove('bg-red-500');
    toast.classList.add('bg-emerald-500');
  } else {
    toast.classList.remove('bg-emerald-500');
    toast.classList.add('bg-red-500');
  }
  
  // Mostrar el toast
  toast.classList.remove('hidden');
  toast.classList.add('show');
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3000);
}

// Función para mostrar modal de confirmación
function mostrarConfirmacion(titulo, mensaje, callback) {
  document.getElementById('confirmacion-titulo').textContent = titulo;
  document.getElementById('confirmacion-mensaje').textContent = mensaje;
  confirmacionCallback = callback;
  document.getElementById('modalConfirmacion').classList.remove('hidden');
}

// Función para ocultar modal de confirmación
function ocultarConfirmacion() {
  document.getElementById('modalConfirmacion').classList.add('hidden');
  confirmacionCallback = null;
}

function fmtDate(v){ return v ? new Date(v).toLocaleString() : "—"; }

// Función para formatear fecha para input datetime-local
function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().slice(0, 16);
}

async function getPerfil(){
  const res = await fetch('/api/perfil',{credentials:'include'});
  return res.ok ? await res.json() : null;
}

async function getTarea(){
  // Primero intentar con el endpoint de detalle
  try {
    const res = await fetch(`/api/tareas?action=detalle&id=${tareaId}`,{credentials:'include'});
    if(res.ok) {
      const tarea = await res.json();
      // Si la tarea no tiene profesor_id, intentar obtenerlo del curso
      if (tarea && !tarea.profesor_id && tarea.curso_id) {
        const cursoRes = await fetch(`/api/cursos?action=detalle&id=${tarea.curso_id}`,{credentials:'include'});
        if (cursoRes.ok) {
          const curso = await cursoRes.json();
          tarea.profesor_id = curso.profesor_id;
        }
      }
      return tarea;
    }
  } catch (error) {
    console.error("Error obteniendo detalle de tarea:", error);
  }
  
  // Si falla, intentar con el endpoint de listado
  try {
    const res = await fetch(`/api/tareas?action=listar&curso_id=${cursoId}`,{credentials:'include'});
    if(!res.ok) return null;
    const tareas = await res.json();
    const tarea = tareas.find(t => t.id == tareaId);
    
    // Si la tarea no tiene profesor_id, intentar obtenerlo del curso
    if (tarea && !tarea.profesor_id && tarea.curso_id) {
      const cursoRes = await fetch(`/api/cursos?action=detalle&id=${tarea.curso_id}`,{credentials:'include'});
      if (cursoRes.ok) {
        const curso = await cursoRes.json();
        tarea.profesor_id = curso.profesor_id;
      }
    }
    return tarea;
  } catch (error) {
    console.error("Error obteniendo listado de tareas:", error);
    return null;
  }
}

async function getEntrega(){
  // Enviamos **ambos** nombres por compatibilidad (id y tareaId)
  const u = new URL('/api/entregas', window.location.origin);
  u.searchParams.set('action', 'detalle');
  u.searchParams.set('id', String(tareaId));
  u.searchParams.set('tareaId', String(tareaId));
  
  try {
    const res = await fetch(u.toString(), {credentials:'include'});
    return res.ok ? await res.json() : null;
  } catch (error) {
    console.error('Error al obtener entrega:', error);
    return null;
  }
}

async function getComentarios(){
  // Intentar con ambos formatos de parámetro para máxima compatibilidad
  try {
    // Primero intentar con tareaId (nuevo formato)
    let res = await fetch(`/api/comentarios?tareaId=${tareaId}`, {credentials:'include'});
    
    // Si falla con 404, intentar con tarea_id (formato legacy)
    if (res.status === 404) {
      res = await fetch(`/api/comentarios?tarea_id=${tareaId}`, {credentials:'include'});
    }
    
    return res.ok ? await res.json() : [];
  } catch (error) {
    console.error('Error al cargar comentarios:', error);
    return [];
  }
}

async function renderComentarios(){
  const comentarios = await getComentarios();
  const tarea = await getTarea(); // Obtener la tarea para acceder a la observación
  
  holder.comentarios.innerHTML='';
  
  // Mostrar la observación del profesor si existe
  if (tarea && tarea.observacion) {
    const divObservacion = document.createElement('div');
    divObservacion.className = "flex items-start gap-3 border-b pb-2 bg-blue-50 p-3 rounded-lg";
    divObservacion.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
        <i class="fas fa-chalkboard-teacher"></i>
      </div>
      <div class="flex-1">
        <p class="text-sm"><span class="font-medium text-blue-700">Profesor</span> <span class="text-gray-500 text-xs">(Comentario de calificación)</span></p>
        <p class="text-gray-700">${tarea.observacion}</p>
      </div>
    `;
    holder.comentarios.appendChild(divObservacion);
  }
  
  if(!comentarios.length && (!tarea || !tarea.observacion)){
    holder.comentarios.innerHTML=`<p class="text-gray-500 text-center">Sin comentarios aún</p>`;
    return;
  }
  
  comentarios.forEach(c=>{
    const div=document.createElement('div');
    div.className="flex items-start gap-3 border-b pb-2";
    div.innerHTML=`
      <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
        ${c.usuario[0].toUpperCase()}
      </div>
      <div class="flex-1">
        <p class="text-sm"><span class="font-medium">${c.usuario}</span> <span class="text-gray-500 text-xs">(${fmtDate(c.fecha)})</span></p>
        <p class="text-gray-700">${c.texto}</p>
      </div>`;
    holder.comentarios.appendChild(div);
  });
}

function openEntrega(tareaId){
  const dlg=document.getElementById('modalEntrega');
  const f=document.getElementById('formEntrega');
  f.reset();
  f.tarea_id.value=tareaId;
  if(f.curso_id) f.curso_id.value=cursoId;
  holder.preview.innerHTML='—';
  holder.archivoActual.textContent='—';
  getEntrega().then(e=>{
    if(!e) return;
    if(e.archivo_nombre) holder.archivoActual.textContent=e.archivo_nombre;
    holder.ultimaEntrega.textContent=e.archivo_nombre||'—';
    if(e.archivo_url){
      const ext=e.archivo_nombre.split('.').pop().toLowerCase();
      if(["png","jpg","jpeg","gif"].includes(ext)){
        holder.preview.innerHTML=`<img src="${e.archivo_url}" class="max-h-48 mx-auto rounded">`;
      }else if(ext==="pdf"){
        holder.preview.innerHTML=`<iframe src="${e.archivo_url}" class="w-full h-48"></iframe>`;
      }else{
        holder.preview.innerHTML=`<a href="${e.archivo_url}" target="_blank" class="text-blue-600 underline">Abrir archivo</a>`;
      }
    }
  });
  dlg.showModal();
}

// Función para verificar y mostrar la última entrega
async function verUltimaEntrega() {
  try {
    const entrega = await getEntrega();
    
    if (entrega && entrega.entrega && entrega.entrega.archivo_nombre) {
      // Si existe entrega, abrir en nueva pestaña
      window.open(`/api/entregas?action=descargar&tarea_id=${tareaId}`, '_blank');
    } else {
      // Mostrar mensaje con animación
      showToast('No existen entregas', false);
      
      // Añadir animación adicional al botón
      const botones = document.getElementById('actividad-buttons');
      const mensaje = document.createElement('div');
      mensaje.id = 'mensaje-sin-entregas';
      mensaje.className = 'w-full mt-3 text-center';
      mensaje.innerHTML = `
        <div class="animate-bounce inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-xl">
          <i class="fas fa-exclamation-circle mr-2"></i>
          No existen entregas para descargar
        </div>
      `;
      
      // Eliminar mensaje anterior si existe
      const mensajeAnterior = document.getElementById('mensaje-sin-entregas');
      if (mensajeAnterior) {
        mensajeAnterior.remove();
      }
      
      // Añadir mensaje y eliminarlo después de 5 segundos
      botones.appendChild(mensaje);
      setTimeout(() => {
        const msg = document.getElementById('mensaje-sin-entregas');
        if (msg) msg.remove();
      }, 5000);
    }
  } catch (error) {
    console.error('Error al verificar entrega:', error);
    showToast('Error al verificar la entrega', false);
  }
}

// Función para abrir modal de edición de tarea
function openEditarTarea(tarea) {
  // Llenar el formulario con los datos actuales de la tarea
  document.getElementById('editar-tarea-id').value = tarea.id;
  document.getElementById('editar-titulo').value = tarea.titulo || tarea.title || '';
  document.getElementById('editar-descripcion').value = tarea.descripcion || tarea.description || '';
  document.getElementById('editar-fecha-limite').value = formatDateForInput(tarea.fecha_limite || tarea.due_at);
  document.getElementById('editar-puntos').value = tarea.puntos || tarea.points || 0;
  
  // Mostrar el modal
  document.getElementById('modalEditarTarea').classList.remove('hidden');
}

// Función para cerrar modal de edición de tarea
function closeEditarTarea() {
  document.getElementById('modalEditarTarea').classList.add('hidden');
}

// Función para guardar los cambios de la tarea
async function guardarCambiosTarea(e) {
  e.preventDefault();
  
  const formData = {
    id: document.getElementById('editar-tarea-id').value,
    titulo: document.getElementById('editar-titulo').value,
    descripcion: document.getElementById('editar-descripcion').value,
    fecha_limite: document.getElementById('editar-fecha-limite').value,
    puntos: document.getElementById('editar-puntos').value
  };
  
  try {
    const res = await fetch('/api/tareas?action=editar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      const data = await res.json();
      showToast('Tarea actualizada correctamente');
      closeEditarTarea();
      
      // Recargar los datos de la tarea
      initActividad();
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Error al actualizar la tarea');
    }
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    showToast('Error: ' + error.message, false);
  }
}

document.getElementById('formEntrega').addEventListener('submit', async e => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('btnSubmitEntrega');
  const submitText = document.getElementById('btnSubmitText');
  const submitSpinner = document.getElementById('btnSubmitSpinner');
  
  // Mostrar spinner de carga
  submitText.textContent = 'Subiendo...';
  submitSpinner.classList.remove('hidden');
  submitBtn.disabled = true;
  
  const formData = new FormData(e.target);
  try {
    const res = await fetch('/api/entregas?action=subir', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (res.ok) {
      const data = await res.json();
      holder.archivoActual.textContent = data?.entrega?.archivo_nombre || formData.get('archivo')?.name || '—';
      holder.ultimaEntrega.textContent = data?.entrega?.archivo_nombre || formData.get('archivo')?.name || '—';
      updateStatusVisual(holder.status, data?.entrega?.estado || 'entregado');
      
      // Cerrar el modal
      document.getElementById('modalEntrega').close();
      
      // Mostrar mensaje de éxito con animación
      showToast('¡Tarea entregada correctamente!');
      
      // Añadir animación al botón de entrega
      const entregarBtn = document.querySelector('[onclick="openEntrega(tareaId)"]');
      if (entregarBtn) {
        entregarBtn.textContent = '✓ Entregado';
        entregarBtn.classList.add('success-animation', 'bg-green-600');
        setTimeout(() => {
          entregarBtn.classList.remove('success-animation');
        }, 600);
      }
      
    } else {
      const data = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(data.error || 'Error al subir el archivo');
    }
  } catch (error) {
    showToast(error.message, false);
    console.error('Error al subir el archivo:', error);
  } finally {
    // Restaurar estado del botón
    submitText.textContent = 'Subir';
    submitSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
});

function updateStatusVisual(statusEl, estado) {
  statusEl.textContent = estado || 'pendiente';
  statusEl.className = "px-2 py-0.5 rounded-full text-xs";
  switch ((estado||'').toLowerCase()) {
    case 'pendiente':
      statusEl.classList.add('bg-red-100','text-red-700');
      break;
    case 'entregado':
      statusEl.classList.add('bg-orange-100','text-orange-700');
      break;
    case 'calificado':
      statusEl.classList.add('bg-green-100','text-green-700');
      break;
    case 'expirado':
      statusEl.classList.add('bg-red-100','text-red-700');
      break;
    default:
      statusEl.classList.add('bg-gray-100','text-gray-800');
  }
}

// ---- Funciones de profesor ----
async function getEntregasProfesor() {
  try {
    const res = await fetch(`/api/entregas?action=listar_por_tarea_profesor&tarea_id=${tareaId}`, {
      credentials: 'include'
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
      
      // Si es error 403, verificar si es profesor de este curso
      if (res.status === 403) {
        // Verificar directamente si el usuario es profesor de este curso
        const tarea = await getTarea();
        const perfil = await getPerfil();
        
        if (tarea && perfil) {
          const esProfesorDelCurso = Number(perfil.id) === Number(tarea.profesor_id);
          
          if (!esProfesorDelCurso) {
            throw new Error("No eres el profesor asignado a este curso");
          } else {
            throw new Error("Error de permisos inesperado. Contacta al administrador.");
          }
        }
      }
      
      throw new Error(`Error ${res.status}: ${errorData.error || 'Error desconocido'}`);
    }
    
    const data = await res.json();
    return data.entregas || [];
  } catch (error) {
    console.error("Error en getEntregasProfesor:", error);
    throw error;
  }
}

async function renderEntregasProfesor() {
  const contenedor = document.getElementById('profesor-entregas');
  const lista = document.getElementById('entregas-list');
  
  // Mostrar estado de carga
  lista.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
      <p class="text-gray-500 mt-2">Cargando entregas...</p>
    </div>
  `;
  contenedor.classList.remove('hidden');

  try {
    const entregas = await getEntregasProfesor();
    
    // Actualizar contador
    holder.entregasCount.textContent = entregas.length;
    
    lista.innerHTML = '';
    if (!entregas.length) {
      lista.innerHTML = '<p class="text-gray-500 text-center py-4">Aún no hay entregas</p>';
      return;
    }

    entregas.forEach(entrega => {
      const div = document.createElement('div');
      div.className = "border rounded-xl p-4";
      
      // Determinar clase de badge según calificación
      let badgeClass = "pending";
      let badgeText = "Pendiente";
      
      if (entrega.calificacion !== null) {
        if (entrega.calificacion >= 9) {
          badgeClass = "excellent";
        } else if (entrega.calificacion >= 7) {
          badgeClass = "good";
        } else {
          badgeClass = "poor";
        }
        badgeText = entrega.calificacion;
      }
      
      div.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                ${entrega.estudiante_nombre.charAt(0)}
              </div>
              <div>
                <p class="font-medium">${entrega.estudiante_nombre}</p>
                <p class="text-xs text-gray-500">${entrega.estudiante_email}</p>
                <p class="text-xs text-gray-500">Entregado: ${fmtDate(entrega.fecha_entrega)}</p>
              </div>
            </div>
            <div class="mt-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                ${entrega.archivo_nombre}
              </span>
            </div>
            ${entrega.observacion ? `
              <div class="mt-2 p-2 bg-gray-50 rounded-md">
                <p class="text-xs text-gray-700"><span class="font-medium">Observación:</span> ${entrega.observacion}</p>
              </div>
            ` : ''}
          </div>
          <div class="flex flex-col sm:items-end space-y-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">Calificación:</span>
              <span class="calification-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="flex space-x-2">
              <a href="/api/entregas?action=descargar&tarea_id=${tareaId}&estudiante_id=${entrega.estudiante_id}" 
                 class="px-3 py-1 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs transition">
                Descargar
              </a>
              <button class="btn-calificar px-3 py-1 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs transition" 
                data-estudiante-id="${entrega.estudiante_id}" data-estudiante-nombre="${entrega.estudiante_nombre}" data-entrega-id="${entrega.id}">
                ${entrega.calificacion !== null ? 'Revisar' : 'Calificar'}
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Añadir event listener al botón de calificar
      const btnCalificar = div.querySelector('.btn-calificar');
      btnCalificar.addEventListener('click', function() {
        const studentName = this.getAttribute('data-estudiante-nombre');
        const entregaId = this.getAttribute('data-entrega-id');
        const calificacionActual = entrega.calificacion || '';
        const observacionActual = entrega.observacion || '';
        
        abrirModalCalificacion(studentName, entregaId, calificacionActual, observacionActual);
      });
      
      lista.appendChild(div);
    });
    
  } catch (error) {
    console.error("Error al cargar entregas:", error);
    lista.innerHTML = `
      <div class="text-center py-4 text-red-600">
        <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
        <p>${error.message}</p>
        <button onclick="renderEntregasProfesor()" class="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm">
          Reintentar
        </button>
      </div>
    `;
  }
}

// Funciones para el modal de calificación
let entregaActualId = null;

async function abrirModalCalificacion(studentName, entregaId, calificacionActual, observacionActual) {
  // Verificar permisos primero
  try {
    const perfil = await getPerfil();
    const tarea = await getTarea();
    
    if (!perfil || !tarea) {
      alert('Error: No se pudo verificar permisos');
      return;
    }
    
    const esProfesorDelCurso = perfil.rol === 'profesor' && 
                              tarea.profesor_id && 
                              Number(perfil.id) === Number(tarea.profesor_id);
    
    const esAdmin = perfil.rol === 'admin';
    
    if (!esProfesorDelCurso && !esAdmin) {
      alert('No tienes permisos para calificar esta entrega');
      return;
    }
    
    // Si tiene permisos, abrir el modal
    document.getElementById('student-name').textContent = studentName;
    document.getElementById('calificacion-input').value = calificacionActual || '';
    document.getElementById('comentario-calificacion').value = observacionActual || '';
    entregaActualId = entregaId;
    
    document.getElementById('modalCalificacion').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error verificando permisos:', error);
    alert('Error verificando permisos: ' + error.message);
  }
}

function cerrarModalCalificacion() {
  document.getElementById('modalCalificacion').classList.add('hidden');
  document.getElementById('calificacion-input').value = '';
  document.getElementById('comentario-calificacion').value = '';
  entregaActualId = null;
}

async function guardarCalificacion() {
  const calificacion = document.getElementById('calificacion-input').value;
  const comentario = document.getElementById('comentario-calificacion').value;
  const studentName = document.getElementById('student-name').textContent;
  
  if (!calificacion || calificacion < 0 || calificacion > 10) {
    alert('Por favor ingresa una calificación válida entre 0 y 10');
    return;
  }
  
  try {
    const res = await fetch('/api/entregas?action=calificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        entrega_id: entregaActualId,
        calificacion: parseFloat(calificacion),
        observacion: comentario
      })
    });
    
    if (res.ok) {
      const result = await res.json();
      alert(`Calificación de ${calificacion}/10 guardada para ${studentName}`);
      cerrarModalCalificacion();
      // Recargar las entregas para reflejar los cambios
      renderEntregasProfesor();
    } else {
      const errorText = await res.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Error al guardar la calificación');
      } catch {
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
    }
  } catch (error) {
    console.error("Error al guardar calificación:", error);
    alert("Error al guardar la calificación: " + error.message);
  }
}


// ---- Inicialización principal ----
async function initActividad() {
  if(!cursoId || !tareaId) {
    alert('Falta cursoId o tareaId');
    return;
  }
  
  try {
    const [perfil, tarea] = await Promise.all([getPerfil(), getTarea()]);
    if(!tarea) throw new Error("Tarea no encontrada");

    // Verificación mejorada de si es profesor
    const esProfesor = perfil?.rol === 'profesor' || perfil?.rol === 'admin';
    const esProfesorDelCurso = esProfesor && tarea.profesor_id && Number(perfil.id) === Number(tarea.profesor_id);

    holder.title.textContent = tarea.titulo || tarea.title || "(Sin título)";
    holder.desc.textContent = tarea.descripcion || tarea.description || "";
    holder.createdAt.textContent = fmtDate(tarea.fecha_creacion || tarea.created_at);
    holder.dueAt.textContent = fmtDate(tarea.fecha_limite || tarea.due_at);
    
    const entrega = await getEntrega();
    updateStatusVisual(holder.status, entrega?.entrega?.estado || 'pendiente');
    holder.ultimaEntrega.textContent = entrega?.entrega?.archivo_nombre || '—';
    holder.archivoActual.textContent = entrega?.entrega?.archivo_nombre || '—';
    holder.points.textContent = tarea.puntos || tarea.points || 0;
    holder.profesor.textContent = tarea.profesor || "—";
    
    if (tarea.calificacion) {
      holder.calificacion.innerHTML = `
        <span class="text-2xl font-bold text-emerald-600">${tarea.calificacion}</span> / 10
        ${tarea.observacion ? `<p class="text-sm text-gray-600 mt-2">${tarea.observacion}</p>` : ''}
      `;
    } else {
      holder.calificacion.innerHTML = `<span class="text-gray-500">Aún no calificado</span>`;
    }
    
    holder.botones.innerHTML = '';

    // Ocultar elementos específicos para profesores
    if(esProfesor){
      document.getElementById('estado-container').classList.add('hidden');
      document.getElementById('profesor-container').classList.add('hidden');
      document.getElementById('entrega-container').classList.add('hidden');
      document.getElementById('calificacion-container').classList.add('hidden');
      document.getElementById('comentarios-container').classList.add('hidden');

      const editar = document.createElement('button');
      editar.textContent = "Editar tarea";
      editar.className = "px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition";
      editar.addEventListener('click', () => openEditarTarea(tarea));

      const eliminar = document.createElement('button');
      eliminar.textContent = "Eliminar tarea";
      eliminar.className = "px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition";
      eliminar.addEventListener('click', async () => {
        mostrarConfirmacion(
          "Eliminar tarea", 
          "¿Seguro que quieres eliminar esta tarea? Esta acción no se puede deshacer.", 
          async () => {
            try {
              const res = await fetch(`/api/tareas?action=eliminar&id=${tareaId}`, {
                method: 'DELETE',
                credentials: 'include'
              });
              
              if (res.ok) {
                showToast('Tarea eliminada correctamente');
                // Redirigir a la página del curso después de eliminar
                setTimeout(() => {
                window.location.href = `/views/curso.html?id=${cursoId}`;
                }, 1500);
              } else {
                const data = await res.json().catch(() => ({error: 'Error desconocido'}));
                throw new Error(data.error || 'Error al eliminar la tarea');
              }
            } catch (error) {
              console.error('Error al eliminar tarea:', error);
              showToast('Error: ' + error.message, false);
            }
          }
        );
      });

      holder.botones.appendChild(editar);
      holder.botones.appendChild(eliminar);

      // Solo cargar entregas si es profesor de este curso
      if (esProfesorDelCurso) {
        await renderEntregasProfesor();
      } else {
        document.getElementById('profesor-entregas').classList.remove('hidden');
        document.getElementById('entregas-list').innerHTML = `
          <div class="text-center py-4 text-orange-600">
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p>No eres el profesor asignado a este curso</p>
            <p class="text-sm text-gray-600">Solo el profesor asignado puede ver las entregas</p>
          </div>
        `;
      }
    } else {
      const entregar = document.createElement('button');
      entregar.textContent = "Entregar";
      entregar.className = "px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-green-700 transition";
      entregar.addEventListener('click', () => openEntrega(tareaId));

      // Botón para ver última entrega (convertido de enlace a botón)
      const ver = document.createElement('button');
      ver.textContent = "Ver última entrega";
      ver.className = "px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition";
      ver.addEventListener('click', verUltimaEntrega);

      const eliminarEntrega = document.createElement('button');
      eliminarEntrega.textContent = "Eliminar entrega";
      eliminarEntrega.className = "px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition";
      eliminarEntrega.addEventListener('click', async () => {
        mostrarConfirmacion(
          "Eliminar entrega", 
          "¿Seguro que quieres eliminar tu entrega?", 
          async () => {
            const res = await fetch(`/api/entregas?action=eliminar&tarea_id=${tareaId}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            if(res.ok){
              showToast("Entrega eliminada");
              holder.ultimaEntrega.textContent = '—';
              updateStatusVisual(holder.status, 'pendiente');
              holder.archivoActual.textContent = '—';
            } else {
              const data = await res.json().catch(() => ({error: 'Error desconocido'}));
              showToast('Error al eliminar entrega: ' + (data.error || 'Desconocido'), false);
            }
          }
        );
      });

      holder.botones.appendChild(entregar);
      holder.botones.appendChild(ver);
      holder.botones.appendChild(eliminarEntrega);
    }
    
    // Solo cargar comentarios si no es profesor
    if (!esProfesor) {
      await renderComentarios();
      
      // Cargar recomendaciones para la tarea actual
      if (window.loadRecsFor) {
        window.loadRecsFor(tareaId, cursoId);
      }
    }
    
  } catch(err) {
    console.error(err);
    alert("Error cargando la actividad");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Configurar event listeners para el modal de entrega
  const btnCancelar = document.getElementById('btnCancelarEntrega');
  btnCancelar.addEventListener('click', () => {
    document.getElementById('modalEntrega').close();
  });

  // Configurar event listeners para el modal de edición de tarea
  document.getElementById('btn-cancelar-editar').addEventListener('click', closeEditarTarea);
  document.getElementById('formEditarTarea').addEventListener('submit', guardarCambiosTarea);
  
  // Cerrar modal de edición al hacer clic fuera de él
  document.getElementById('modalEditarTarea').addEventListener('click', function(e) {
    if (e.target === this) {
      closeEditarTarea();
    }
  });

  const inputArchivo = document.querySelector('input[name="archivo"]');
  inputArchivo.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('previewContent');
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (["png","jpg","jpeg","gif"].includes(ext)) {
      preview.innerHTML = `<img src="${URL.createObjectURL(file)}" class="max-h-48 mx-auto rounded">`;
    } else if (ext === "pdf") {
      preview.innerHTML = `<iframe src="${URL.createObjectURL(file)}" class="w-full h-48"></iframe>`;
    } else {
      preview.innerHTML = `<span class="text-gray-600">${file.name}</span>`;
    }
  });

  // Configurar event listeners para el modal de calificación
  document.getElementById('btn-cancelar-calificacion').addEventListener('click', cerrarModalCalificacion);
  document.getElementById('btn-guardar-calificacion').addEventListener('click', guardarCalificacion);
  
  // Cerrar modal al hacer clic fuera de él
  document.getElementById('modalCalificacion').addEventListener('click', function(e) {
    if (e.target === this) {
      cerrarModalCalificacion();
    }
  });

  // Configurar event listeners para el modal de confirmación
  document.getElementById('btn-cancelar-confirmacion').addEventListener('click', ocultarConfirmacion);
  document.getElementById('btn-confirmar-accion').addEventListener('click', function() {
    if (confirmacionCallback) {
      confirmacionCallback();
    }
    ocultarConfirmacion();
  });
  
  // Cerrar modal de confirmación al hacer clic fuera de él
  document.getElementById('modalConfirmacion').addEventListener('click', function(e) {
    if (e.target === this) {
      ocultarConfirmacion();
    }
  });

  // Agregar event listener para el botón de exportar
  document.getElementById('btn-exportar').addEventListener('click', async () => {
    try {
      // Mostrar indicador de carga
      showToast('Generando archivo de calificaciones...');
      
      // Llamar al endpoint de exportación
      const response = await fetch(`/api/entregas?action=exportar_calificaciones&tarea_id=${tareaId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Convertir la respuesta a blob
      const blob = await response.blob();
      
      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'calificaciones.xlsx';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Mostrar mensaje de éxito
      showToast('Archivo exportado correctamente');
    } catch (error) {
      console.error('Error al exportar calificaciones:', error);
      showToast('Error al exportar calificaciones: ' + error.message, false);
    }
  });

  // Configurar event listener para el botón de regresar
  document.getElementById('btn-regresar').addEventListener('click', () => {
  window.location.href = `/views/curso.html?id=${cursoId}`;
  });

  // Inicializar la actividad
  initActividad();
});
