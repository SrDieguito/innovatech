<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: login.js");
    exit();
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pasantia";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Obtener el ID del usuario desde la URL
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    die("ID de usuario inválido.");
}

$profile_id = $_GET['id'];

// Obtener la información del perfil del usuario
$stmt = $conn->prepare("
    SELECT nombre, email, telefono, procedencia, perfil, cedula_ruc_pasaporte, ubicacion, fase, deck, descripcion, imagen_perfil, banner, password, campo_accion, email, organizacion
    FROM usuarios
    WHERE id = ?
");
$stmt->bind_param("i", $profile_id);
$stmt->execute();
$stmt->bind_result(
    $nombre, $email, $telefono, $procedencia, $perfil, $cedula_ruc_pasaporte,$ubicacion, $fase, $deck, $descripcion, $imagen_perfil, $banner, $password, $campo_accion, $email, $organizacion
);
$stmt->fetch();
$stmt->close();
$conn->close();

if (!$nombre) {
    die("Perfil no encontrado.");
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil de <?php echo htmlspecialchars($nombre); ?> - UTM 2024</title>
    <link rel="stylesheet" href="css/ver_perfil.css"> <!-- Asegúrate de tener este archivo CSS -->
</head>
<body>
    <header class="profile-header">
        <a href="explorar_perfiles.js" class="nav-link">Volver a Explorar Perfiles</a>
    </header>
    <main class="profile-container">
        <div class="profile-card">
            <div class="banner-container">
                <img src="<?php echo htmlspecialchars($banner); ?>" alt="Banner" class="banner-image">
                <div class="profile-image-container">
                    <img src="<?php echo htmlspecialchars($imagen_perfil); ?>" alt="<?php echo htmlspecialchars($nombre); ?>" class="profile-image">
                </div>
            </div>
            <h2 class="profile-name"><?php echo htmlspecialchars($nombre); ?></h2>
            <div class="profile-info">
                <div class="info-box">
                    <h3>Información Adicional</h3>
                    <p><strong>Gmail:</strong> <?php echo htmlspecialchars($email); ?></p>
                    <p><strong>Teléfono:</strong> <?php echo htmlspecialchars($telefono); ?></p>
                    <p><strong>Organización:</strong> <?php echo htmlspecialchars($organizacion); ?></p>
                    <p><strong>Perfil:</strong> <?php echo htmlspecialchars($perfil); ?></p>
                    <p><strong>Ubicación:</strong> <?php echo htmlspecialchars($ubicacion); ?></p>
                    <p><strong>Fase:</strong> <?php echo htmlspecialchars($fase); ?></p>
                    <p><strong>Deck:</strong> <?php echo htmlspecialchars($deck); ?></p>
                    <p><strong>Procedencia:</strong> <?php echo htmlspecialchars($procedencia); ?></p>
                    <p><strong>Campo de Acción:</strong> <?php echo htmlspecialchars($campo_accion); ?></p>
                </div>
                <div class="description-box">
                    <h3>Descripción</h3>
                    <p><?php echo htmlspecialchars($descripcion); ?></p>
                </div>
            </div>
            <!-- Botón de Solicitar Reunión -->
            <div class="request-meeting">
                <a href="solicitar_reunion.js?id=<?php echo $profile_id; ?>" class="btn-request-meeting">Solicitar Reunión</a>
            </div>
        </div>
    </main>
</body>
</html>
