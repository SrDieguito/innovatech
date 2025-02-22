<?php
session_start(); // Inicia la sesión

// Verifica si el usuario está autenticado y tiene el rol de admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_rol'] !== 'admin') {
    // Redirige a la página de inicio de sesión si no está autenticado o no es admin
    header("Location:/auth/login.html?error=" . urlencode("Acceso no autorizado."));
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

// Verifica si se ha enviado un ID de usuario
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    die("Error: ID de usuario no válido.");
}

$user_id = intval($_GET['id']);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rechazar Usuario - UTM 2024</title>
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <header>
        <h1>Rechazar Usuario</h1>
        <nav>
            <a href="index.html" class="btn-back">Regresar al Panel</a>
        </nav>
    </header>
    <main>
        <h2>Motivo del Rechazo</h2>
        <form action="procesar_rechazo.php" method="post">
            <input type="hidden" name="user_id" value="<?php echo $user_id; ?>">
            <label for="rejection_reason">Motivo del rechazo:</label>
            <textarea id="rejection_reason" name="rejection_reason" rows="4" required></textarea>
            <button type="submit" class="btn-reject">Enviar Rechazo</button>
        </form>
    </main>
</body>
</html>
