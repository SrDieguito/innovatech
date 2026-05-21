/**
 * Tareas Form - Manejo del formulario de creación/edición de tareas
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const formTarea = document.getElementById('form-tarea');
    const btnCancelar = document.getElementById('btn-cancelar');
    const cursoIdInput = document.getElementById('curso_id');
    const fechaLimiteInput = document.getElementById('fecha_limite');

    // Inicialización
    init();

    /**
     * Inicializa la página
     */
    function init() {
        // Obtener el ID del curso de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const cursoId = urlParams.get('curso_id');
        
        if (!cursoId) {
            mostrarError('No se ha especificado el curso', '/cursos.html');
            return;
        }

        // Establecer el ID del curso en el formulario
        cursoIdInput.value = cursoId;
        
        // Cargar el header y footer
        loadHeader();
        loadFooter();

        // Configurar la fecha mínima como la fecha actual
        const fechaHoy = new Date().toISOString().slice(0, 16);
        fechaLimiteInput.min = fechaHoy;

        // Configurar manejadores de eventos
        configurarEventListeners();
    }

    /**
     * Configura los manejadores de eventos
     */
    function configurarEventListeners() {
        // Envío del formulario
        formTarea.addEventListener('submit', manejarEnvioFormulario);
        
        // Botón cancelar
        btnCancelar.addEventListener('click', manejarCancelar);
    }

    /**
     * Maneja el envío del formulario
     * @param {Event} e - Evento de envío del formulario
     */
    async function manejarEnvioFormulario(e) {
        e.preventDefault();
        
        const formData = {
            curso_id: cursoIdInput.value,
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            fecha_limite: fechaLimiteInput.value,
            puntos: document.getElementById('puntos').value || 0
        };

        try {
            const response = await fetch(`/api/tareas?action=crear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                await mostrarExito('¡Éxito!', 'La tarea ha sido creada correctamente');
                // Redirigir a la página del curso
                window.location.href = `/curso-detalle.html?curso_id=${formData.curso_id}`;
            } else {
                throw new Error(result.error || 'Error al crear la tarea');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error', error.message || 'Ocurrió un error al crear la tarea');
        }
    }

    /**
     * Maneja el evento de cancelar
     * @param {Event} e - Evento de clic
     */
    function manejarCancelar(e) {
        e.preventDefault();
        const cursoId = cursoIdInput.value;
        window.location.href = `/curso-detalle.html?curso_id=${cursoId}`;
    }

    /**
     * Muestra un mensaje de éxito
     * @param {string} titulo - Título del mensaje
     * @param {string} mensaje - Contenido del mensaje
     * @returns {Promise} Promesa que se resuelve cuando se cierra el mensaje
     */
    function mostrarExito(titulo, mensaje) {
        return Swal.fire({
            icon: 'success',
            title: titulo,
            text: mensaje,
            confirmButtonText: 'Aceptar'
        });
    }

    /**
     * Muestra un mensaje de error
     * @param {string} titulo - Título del error
     * @param {string} mensaje - Mensaje de error
     * @param {string} [redireccion] - URL para redireccionar después de aceptar
     */
    function mostrarError(titulo, mensaje, redireccion) {
        const config = {
            icon: 'error',
            title: titulo,
            text: mensaje,
            confirmButtonText: 'Entendido'
        };

        if (redireccion) {
            config.willClose = () => {
                window.location.href = redireccion;
            };
        }

        Swal.fire(config);
    }
});
