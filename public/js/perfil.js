document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/api/perfil", { credentials: "include" });

        if (!response.ok) {
            console.warn("Sesión no válida, redirigiendo al login...");
            return window.location.href = "/auth/login.html"; // Solo redirige si el error es 401
        }

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
        // Evitar redirigir automáticamente sin verificar si es un problema temporal
    }

    document.getElementById("open-password-modal").addEventListener("click", function () {
        const newPassword = prompt("Introduce tu nueva contraseña:");
        if (newPassword) {
            fetch("/api/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ new_password: newPassword })
            }).then(response => response.json())
              .then(data => alert(data.message))
              .catch(error => console.error("Error al cambiar contraseña:", error));
        }
    });

    document.getElementById("logout-button").addEventListener("click", async function () {
        if (!confirm("¿Estás seguro de que quieres cerrar sesión?")) return;

        try {
            const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

            if (!response.ok) throw new Error("Error cerrando sesión");

            document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=" + window.location.hostname + "; secure; SameSite=None";

            window.location.href = "/auth/login.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });
});
