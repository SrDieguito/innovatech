// Función para actualizar la descripción del curso
async function actualizarDescripcion() {
  const texto = document.querySelector('#presentacion-textarea').value;
  const urlParams = new URLSearchParams(window.location.search);
  const cursoId = urlParams.get('id');

  try {
    const resp = await fetch(`/api/cursos?action=actualizar-descripcion&curso_id=${cursoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: texto })
    });

    const data = await resp.json();
    if (resp.ok && data.success) {
      alert('Descripción actualizada correctamente');
      location.reload();
    } else {
      throw new Error(data.error || 'No se pudo actualizar la descripción');
    }
  } catch (error) {
    console.error('Error al actualizar la descripción:', error);
    alert('Error: ' + (error.message || 'Error al actualizar la descripción'));
  }
}

// Inicialización del editor de presentación (si es profesor)
document.addEventListener('DOMContentLoaded', () => {
  const btnEditar = document.getElementById('btn-editar-descripcion');
  const editor = document.getElementById('presentacion-editor');
  const textoPresentacion = document.getElementById('presentacion-texto');
  const textarea = document.getElementById('presentacion-textarea');
  const btnCancelar = document.getElementById('cancelar-descripcion');

  if (btnEditar && editor && textoPresentacion && textarea && btnCancelar) {
    // Mostrar botón de edición solo para profesores
    if (btnEditar.classList.contains('hidden')) {
      btnEditar.classList.remove('hidden');
    }

    // Configurar el evento de edición
    btnEditar.addEventListener('click', () => {
      textarea.value = textoPresentacion.textContent;
      textoPresentacion.classList.add('hidden');
      editor.classList.remove('hidden');
    });

    // Configurar el evento de cancelar
    btnCancelar.addEventListener('click', () => {
      editor.classList.add('hidden');
      textoPresentacion.classList.remove('hidden');
    });
  }
});
