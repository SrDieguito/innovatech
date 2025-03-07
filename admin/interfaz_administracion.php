<?php
session_start(); // Inicia la sesión

// Verifica si el usuario está autenticado y tiene el rol de admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_rol'] !== 'admin') {
    // Redirige a la página de inicio de sesión si no está autenticado o no es admin
    header("Location: /auth/login.html?error=" . urlencode("Acceso no autorizado."));
    exit();
}

// Conectar a la base de datos
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pasantia";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Obtener usuarios no aprobados (pendientes)
$sql_pendientes = "SELECT * FROM usuarios WHERE estado = 'pendiente'";
$result_pendientes = $conn->query($sql_pendientes);

// Obtener usuarios aprobados
$sql_aprobados = "SELECT * FROM usuarios WHERE estado = 'aprobado'";
$result_aprobados = $conn->query($sql_aprobados);

// Obtener usuarios rechazados
$sql_rechazados = "SELECT * FROM usuarios WHERE estado = 'rechazado'";
$result_rechazados = $conn->query($sql_rechazados);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - UTM 2024</title>
    <link rel="stylesheet" href="/css/admin.css">
    <script>
        function toggleVisibility(id) {
            var element = document.getElementById(id);
            element.style.display = element.style.display === 'block' ? 'none' : 'block';
        }

        function showSuccessMessage() {
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('status') === 'success') {
                var messageBox = document.getElementById('success-message');
                messageBox.style.display = 'block';
                setTimeout(function() {
                    messageBox.style.display = 'none';
                }, 5000); // Ocultar el mensaje después de 5 segundos
            }
        }
    </script>
</head>
<body onload="showSuccessMessage()">
    <header>
        <h1>Panel de Administración</h1>
        <nav>
            <a href="/auth/logout.js" class="btn-logout">Cerrar sesión</a>
        </nav>
    </header>
    <main>
        <!-- Sección de usuarios pendientes -->
        <section>
            <h2 class="toggle-button" onclick="toggleVisibility('pendientes')">Ver Usuarios Pendientes</h2>
            <div id="pendientes" style="display: none;">
                <?php if ($result_pendientes->num_rows > 0): ?>
                    <?php while($row = $result_pendientes->fetch_assoc()): ?>
                        <div class="user-card">
                            <h3><?php echo htmlspecialchars($row['nombre']); ?></h3>
                            <p><strong>Email:</strong> <?php echo htmlspecialchars($row['email']); ?></p>
                            <button onclick="toggleVisibility('details-<?php echo $row['id']; ?>')">Ver Detalles</button>
                            <div id="details-<?php echo $row['id']; ?>" class="form-details" style="display:none;">
                                <!-- Detalles del usuario -->
                                <p><strong>Fecha de registro:</strong> <?php echo htmlspecialchars($row['fecha_actualizacion']); ?></p>
                                <p><strong>Teléfono:</strong> <?php echo htmlspecialchars($row['telefono']); ?></p>
                                <p><strong>Perfil:</strong> <?php echo htmlspecialchars($row['perfil']); ?></p>
                                <p><strong>Organización:</strong> <?php echo htmlspecialchars($row['organizacion']); ?></p>
                                <p><strong>Cédula, RUC o Pasaporte:</strong> <?php echo htmlspecialchars($row['cedula_ruc_pasaporte']); ?></p>
                                <p><strong>Ubicación (País, Provincia, Código Postal):</strong> <?php echo htmlspecialchars($row['ubicacion']); ?></p>
                                <p><strong>Fase:</strong> <?php echo htmlspecialchars($row['fase']); ?></p>
                                <p><strong>Pitches:</strong> <?php echo htmlspecialchars($row['pitches']); ?></p>
                                <p><strong>Deck:</strong> <a href="<?php echo htmlspecialchars($row['deck']); ?>" target="_blank">Ver Deck</a></p>
                                <p><strong>Descripción:</strong> <?php echo htmlspecialchars($row['descripcion']); ?></p>
                                <p><strong>Procedencia:</strong> <?php echo htmlspecialchars($row['procedencia']); ?></p>
                                <p><strong>Campo de Acción:</strong> <?php echo htmlspecialchars($row['campo_accion']); ?></p>
                                <a href="aprobar_usuario.js?id=<?php echo $row['id']; ?>" class="btn-approve">Aprobar</a>
                                <a href="rechazar_usuario.js?id=<?php echo $row['id']; ?>" class="btn-reject">Rechazar</a>
                            </div>
                        </div>
                    <?php endwhile; ?>
                <?php else: ?>
                    <p>No hay solicitudes pendientes.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- Sección de registro de usuarios -->
        <section>
            <h2 class="toggle-button" onclick="toggleVisibility('registro')">Registro de Usuarios</h2>
            <div id="registro" style="display: none;">
                <h3 class="toggle-button" onclick="toggleVisibility('aprobados')">Usuarios Aprobados</h3>
                <div id="aprobados" style="display: none;">
                    <?php if ($result_aprobados->num_rows > 0): ?>
                        <?php while($row = $result_aprobados->fetch_assoc()): ?>
                            <div class="user-card">
                                <h3><?php echo htmlspecialchars($row['nombre']); ?></h3>
                                <p><strong>Email:</strong> <?php echo htmlspecialchars($row['email']); ?></p>
                                <button onclick="toggleVisibility('details-<?php echo $row['id']; ?>')">Ver Detalles</button>
                                <div id="details-<?php echo $row['id']; ?>" class="form-details" style="display:none;">
                                    <p><strong>Fecha de aprobación:</strong> <?php echo htmlspecialchars($row['fecha_actualizacion']); ?></p>
                                    <p><strong>Fecha de registro:</strong> <?php echo htmlspecialchars($row['fecha_registro']); ?></p>
                                    <p><strong>Teléfono:</strong> <?php echo htmlspecialchars($row['telefono']); ?></p>
                                    <p><strong>Perfil:</strong> <?php echo htmlspecialchars($row['perfil']); ?></p>
                                    <p><strong>Organización:</strong> <?php echo htmlspecialchars($row['organizacion']); ?></p>
                                    <p><strong>Cédula, RUC o Pasaporte:</strong> <?php echo htmlspecialchars($row['cedula_ruc_pasaporte']); ?></p>
                                    <p><strong>Ubicación (País, Provincia, Código Postal):</strong> <?php echo htmlspecialchars($row['ubicacion']); ?></p>
                                    <p><strong>Fase:</strong> <?php echo htmlspecialchars($row['fase']); ?></p>
                                    <p><strong>Pitches:</strong> <?php echo htmlspecialchars($row['pitches']); ?></p>
                                    <p><strong>Deck:</strong> <a href="<?php echo htmlspecialchars($row['deck']); ?>" target="_blank">Ver Deck</a></p>
                                    <p><strong>Descripción:</strong> <?php echo htmlspecialchars($row['descripcion']); ?></p>
                                    <p><strong>Procedencia:</strong> <?php echo htmlspecialchars($row['procedencia']); ?></p>
                                    <p><strong>Campo de Acción:</strong> <?php echo htmlspecialchars($row['campo_accion']); ?></p>
                                </div>
                            </div>
                        <?php endwhile; ?>
                    <?php else: ?>
                        <p>No hay usuarios aprobados.</p>
                    <?php endif; ?>
                </div>

                <h3 class="toggle-button" onclick="toggleVisibility('rechazados')">Usuarios Rechazados</h3>
                <div id="rechazados" style="display: none;">
                    <?php if ($result_rechazados->num_rows > 0): ?>
                        <?php while($row = $result_rechazados->fetch_assoc()): ?>
                            <div class="user-card">
                                <h3><?php echo htmlspecialchars($row['nombre']); ?></h3>
                                <p><strong>Email:</strong> <?php echo htmlspecialchars($row['email']); ?></p>
                                <button onclick="toggleVisibility('details-<?php echo $row['id']; ?>')">Ver Detalles</button>
                                <div id="details-<?php echo $row['id']; ?>" class="form-details" style="display:none;">
                                    <p><strong>Fecha de Rechazo:</strong> <?php echo htmlspecialchars($row['fecha_actualizacion']); ?></p>
                                    <p><strong>Fecha de Registro:</strong> <?php echo htmlspecialchars($row['fecha_registro']); ?></p>
                                    <p><strong>Teléfono:</strong> <?php echo htmlspecialchars($row['telefono']); ?></p>
                                    <p><strong>Perfil:</strong> <?php echo htmlspecialchars($row['perfil']); ?></p>
                                    <p><strong>Organización:</strong> <?php echo htmlspecialchars($row['organizacion']); ?></p>
                                    <p><strong>Cédula, RUC o Pasaporte:</strong> <?php echo htmlspecialchars($row['cedula_ruc_pasaporte']); ?></p>
                                    <p><strong>Ubicación (País, Provincia, Código Postal):</strong> <?php echo htmlspecialchars($row['ubicacion']); ?></p>
                                    <p><strong>Fase:</strong> <?php echo htmlspecialchars($row['fase']); ?></p>
                                    <p><strong>Pitches:</strong> <?php echo htmlspecialchars($row['pitches']); ?></p>
                                    <p><strong>Deck:</strong> <a href="<?php echo htmlspecialchars($row['deck']); ?>" target="_blank">Ver Deck</a></p>
                                    <p><strong>Descripción:</strong> <?php echo htmlspecialchars($row['descripcion']); ?></p>
                                    <p><strong>Procedencia:</strong> <?php echo htmlspecialchars($row['procedencia']); ?></p>
                                    <p><strong>Campo de Acción:</strong> <?php echo htmlspecialchars($row['campo_accion']); ?></p>
                                </div>
                            </div>
                        <?php endwhile; ?>
                    <?php else: ?>
                        <p>No hay usuarios rechazados.</p>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <div id="success-message" style="display:none; background-color: #d4edda; color: #155724; padding: 10px; border: 1px solid #c3e6cb;">
            Usuario aprobado y notificado correctamente.
        </div>
    </main>
</body>
</html>

<?php $conn->close(); ?>
