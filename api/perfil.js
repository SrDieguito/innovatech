document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/api/perfil"); // Conectar con la API
        const data = await response.json();

        document.getElementById("user-name").textContent = data.nombre;
        document.getElementById("user-description").textContent = data.descripcion;
        document.getElementById("profile-image").src = data.foto_perfil || "default-avatar.png";
        document.getElementById("banner").src = data.banner || "default-banner.jpg";
        document.getElementById("user-email").textContent = data.email;
        document.getElementById("user-phone").textContent = data.telefono;
        document.getElementById("user-organization").textContent = data.organizacion;
        document.getElementById("user-location").textContent = data.ubicacion;
    } catch (error) {
        console.error("Error cargando perfil:", error);
    }

    document.getElementById("open-password-modal").addEventListener("click", function () {
        alert("Función de cambio de contraseña en desarrollo");
    });
});
