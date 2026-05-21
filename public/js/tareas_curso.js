// Tareas del Curso component JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    // Variables globales
    let cursoId = null;
    let tareaAEliminar = null;
    let modalEliminar = null;

    // Obtener el rol del usuario
    async function getCurrentUserRole() {
        try {
            const response = await fetch('/api/sesion', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                return data?.rol?.toLowerCase() || 'estudiante';
            }
            return 'estudiante';
        } catch (error) {
            console.error('Error al obtener el rol del usuario:', error);
            return 'estudiante';
        }
    }

    // Inicialización
    async function init() {
        // Obtener el ID del curso de la URL
        const urlParams = new URLSearchParams(window.location.search);
        cursoId = urlParams.get('curso_id');
        
        if (!cursoId) {
            mostrarError('No se ha especificado el curso');
            return;
        }

        // Inicializar componentes
        modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminarTarea'));
        
        // Obtener el rol del usuario y configurar la UI según el rol
        const userRole = await getCurrentUserRole();
        const isProfesor = ['profesor', 'admin'].includes(userRole);
        const btnNuevaTarea = document.getElementById('btn-nueva-tarea');
        if (btnNuevaTarea) {
            btnNuevaTarea.style.display = isProfesor ? 'inline-flex' : 'none';
        }
        
        // Configurar eventos
        setupEventListeners();
        
        // Cargar datos iniciales
        await cargarTareas();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Navegación
        document.getElementById('btn-nueva-tarea').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `/templates/agregar_tarea.html?curso_id=${cursoId}`;
        });

        document.getElementById('btn-volver').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `/curso-detalle.html?curso_id=${cursoId}`;
        });

        // Filtros
        document.getElementById('btn-aplicar-filtros').addEventListener('click', cargarTareas);
        document.getElementById('btn-confirmar-eliminar').addEventListener('click', eliminarTarea);
    }

    // Cargar tareas del curso
    async function cargarTareas() {
        try {
            const response = await fetch(`/api/tareas?action=listar&curso_id=${cursoId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error al cargar las tareas');
            }

            const tareas = await response.json();
            mostrarTareas(tareas);
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar las tareas');
        }
    }

    // Mostrar tareas en la interfaz
    function mostrarTareas(tareas) {
        const listaTareas = document.getElementById('lista-tareas');
        const sinTareas = document.getElementById('sin-tareas');
        
        if (!tareas || tareas.length === 0) {
            listaTareas.innerHTML = '';
            sinTareas.style.display = 'block';
            return;
        }

        // Obtener filtros
        const mostrarPendientes = document.getElementById('filtro-pendientes').checked;
        const mostrarCompletadas = document.getElementById('filtro-completadas').checked;
        const mostrarVencidas = document.getElementById('filtro-vencidas').checked;
        const filtroFecha = document.getElementById('filtro-fecha').value;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Filtrar tareas
        const tareasFiltradas = tareas.filter(tarea => {
            const fechaLimite = new Date(tarea.fecha_limite);
            const esVencida = fechaLimite < hoy;
            const esCompletada = tarea.completada || false;
            const esPendiente = !esCompletada && !esVencida;

            // Aplicar filtros de estado
            if ((esPendiente && !mostrarPendientes) || 
                (esCompletada && !mostrarCompletadas) || 
                (esVencida && !mostrarVencidas)) {
                return false;
            }

            // Aplicar filtro de fecha
            if (filtroFecha !== 'todas') {
                const fechaInicio = new Date(hoy);
                let fechaFin = new Date(hoy);

                if (filtroFecha === 'hoy') {
                    fechaFin.setDate(fechaFin.getDate() + 1);
                } else if (filtroFecha === 'semana') {
                    fechaFin.setDate(fechaFin.getDate() + 7);
                } else if (filtroFecha === 'mes') {
                    fechaFin.setMonth(fechaFin.getMonth() + 1);
                }

                return fechaLimite >= fechaInicio && fechaLimite < fechaFin;
            }

            return true;
        });

        // Mostrar mensaje si no hay tareas con los filtros actuales
        if (tareasFiltradas.length === 0) {
            listaTareas.innerHTML = '';
            sinTareas.style.display = 'block';
            return;
        }

        // Ordenar tareas por fecha límite (más cercana primero)
        tareasFiltradas.sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));

        // Generar HTML de las tareas
        let html = '';
        tareasFiltradas.forEach(tarea => {
            const fechaLimite = new Date(tarea.fecha_limite);
            const esVencida = fechaLimite < hoy;
            const esCompletada = tarea.completada || false;
            
            let claseEstado = '';
            if (esCompletada) {
                claseEstado = 'tarea-card--completada';
            } else if (esVencida) {
                claseEstado = 'tarea-card--vencida';
            } else {
                claseEstado = 'tarea-card--pendiente';
            }

            html += `
                <div class="card tarea-card ${claseEstado}" data-tarea-id="${tarea.id}">
                    <div class="tarea-card__body">
                        <div class="tarea-card__header">
                            <h5 class="tarea-card__title">${escapeHtml(tarea.titulo)}</h5>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item" href="/templates/editar_tarea.html?curso_id=${cursoId}&tarea_id=${tarea.id}"><i class="bi bi-pencil me-2"></i>Editar</a></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="solicitarEliminacion(event, ${tarea.id}, '${escapeHtml(tarea.titulo)}')"><i class="bi bi-trash me-2"></i>Eliminar</a></li>
                                </ul>
                            </div>
                        </div>
                        <p class="tarea-card__descripcion">${escapeHtml(tarea.descripcion || 'Sin descripción')}</p>
                        <div class="tarea-card__meta">
                            <span class="badge bg-${esCompletada ? 'success' : esVencida ? 'danger' : 'warning'}">
                                ${esCompletada ? 'Completada' : esVencida ? 'Vencida' : 'Pendiente'}
                            </span>
                            <span class="tarea-card__fecha">
                                <i class="bi bi-calendar-event"></i>
                                Vence: ${formatearFecha(fechaLimite)}
                            </span>
                            ${tarea.puntos ? `
                                <span class="tarea-card__puntos">
                                    <i class="bi bi-star-fill text-warning"></i> ${tarea.puntos} pts
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        listaTareas.innerHTML = html;
        sinTareas.style.display = 'none';
    }

    // Formatear fecha
    function formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Escapar HTML para prevenir XSS
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

    // Solicitar confirmación antes de eliminar una tarea
    window.solicitarEliminacion = function(event, tareaId, tituloTarea) {
        event.preventDefault();
        tareaAEliminar = tareaId;
        
        Swal.fire({
            title: '¿Eliminar tarea?',
            text: `¿Estás seguro de que deseas eliminar la tarea "${escapeHtml(tituloTarea)}"? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarTarea();
            }
        });
    };

    // Eliminar una tarea
    async function eliminarTarea() {
        if (!tareaAEliminar) return;

        try {
            const response = await fetch(`/api/tareas?action=eliminar&tarea_id=${tareaAEliminar}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Eliminada!',
                    text: 'La tarea ha sido eliminada correctamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Recargar la lista de tareas
                await cargarTareas();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar la tarea');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Ocurrió un error al eliminar la tarea',
                confirmButtonText: 'Entendido'
            });
        } finally {
            tareaAEliminar = null;
            modalEliminar.hide();
        }
    }

    // Mostrar mensaje de error
    function mostrarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje,
            confirmButtonText: 'Aceptar'
        }).then(() => {
            window.location.href = '/cursos.html';
        });
    }

    // Iniciar la aplicación
    init();
});
