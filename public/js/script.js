document.addEventListener("DOMContentLoaded", function () {
    const campoAccionSelect = document.getElementById("campo_accion");
    const campoAccionOtroInput = document.getElementById("campo_accion_otro");
    const otrosCampoAccionBox = document.getElementById("otros-campo-accion-box");

    // Mostrar/ocultar campo "Otros" en "Campo de acción"
    if (campoAccionSelect) {
        campoAccionSelect.addEventListener("change", function () {
            if (this.value === "Otros") {
                otrosCampoAccionBox.style.display = "block";
                campoAccionOtroInput.required = true;
            } else {
                otrosCampoAccionBox.style.display = "none";
                campoAccionOtroInput.required = false;
            }
        });
    }

    // Manejo del formulario
    const form = document.getElementById("registroForm");

    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault(); // Evita el envío tradicional del formulario

            // Capturar los datos del formulario
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Verificar si el usuario seleccionó "Otros" en "Campo de acción"
            if (campoAccionSelect.value === "Otros") {
                data.campo_accion = campoAccionOtroInput.value.trim(); // Reemplaza con el valor ingresado
            }

            try {
                const response = await fetch("/api/procesarformulario", {
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
    }
});
