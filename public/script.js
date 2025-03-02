// Mostrar campo "Otro perfil" si se selecciona "Otro"
document.getElementById('perfil').addEventListener('change', function() {
    var otroPerfilBox = document.getElementById('otro-perfil-box');
    if (this.value === 'otro') {
        otroPerfilBox.style.display = 'block';
    } else {
        otroPerfilBox.style.display = 'none';
    }
});

// Enviar el formulario a la API en Node.js
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registroForm");

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Evita el envío tradicional del formulario

        // Capturar los datos del formulario
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch("/api/procesar_formulario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Registro enviado correctamente.");
                window.location.href = "/index.html"; // Redirige si todo va bien
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        }
    });
});
