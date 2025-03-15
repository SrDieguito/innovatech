document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/perfil_usuario');
        const data = await response.json();

        if (data.error) {
            console.error('Error:', data.error);
            return;
        }

        document.getElementById('nombre').textContent = data.nombre;
        document.getElementById('email').textContent = data.email;
        document.getElementById('telefono').textContent = data.telefono;
        document.getElementById('organizacion').textContent = data.organizacion;
        document.getElementById('perfil').textContent = data.perfil;
        document.getElementById('ubicacion').textContent = data.ubicacion;
        document.getElementById('fase').textContent = data.fase;
        document.getElementById('deck').textContent = data.deck;
        document.getElementById('procedencia').textContent = data.procedencia;
        document.getElementById('campo_accion').textContent = data.campo_accion;
        document.getElementById('descripcion').textContent = data.descripcion;
        document.getElementById('imagen_perfil').src = data.imagen_perfil || '/imagenes/default-profile.png';
        document.getElementById('banner').src = data.banner || '/imagenes/default-banner.png';

    } catch (error) {
        console.error('Error al obtener el perfil:', error);
    }
});
