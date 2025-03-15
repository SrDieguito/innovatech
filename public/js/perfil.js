document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/api/perfil"); // Conectar con la API
        const data = await response.json();

        document.getElementById("user-name").textContent = data.nombre;
        document.getElementById("user-description").textContent = data.descripcion;
        document.getElementById("profile-image").src = data.imagen_perfil || "default-avatar.png";
        document.getElementById("banner").src = data.banner || "default-banner.jpg";
        document.getElementById("user-email").textContent = data.email;
        document.getElementById("user-phone").textContent = data.telefono;
        document.getElementById("user-organization").textContent = data.organizacion;
        document.getElementById("user-location").textContent = data.ubicacion;
    } catch (error) {
        console.error("Error cargando perfil:", error);
    }

    document.getElementById("open-password-modal").addEventListener("click", function () {
        const newPassword = prompt("Introduce tu nueva contraseña:");
        if (newPassword) {
            fetch("/api/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_password: newPassword })
            }).then(response => response.json())
              .then(data => alert(data.message))
              .catch(error => console.error("Error al cambiar contraseña:", error));
        }
    });
});
