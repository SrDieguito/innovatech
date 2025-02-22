<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
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

$user_id = $_SESSION['user_id'];

// Obtener la foto de perfil del usuario logueado
$stmt = $conn->prepare("SELECT imagen_perfil FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$stmt->bind_result($user_profile_pic);
$stmt->fetch();
$stmt->close();

$search_query = "";
if (isset($_POST['search'])) {
    $search_query = $_POST['search_query'];
}

$sql = "SELECT id, nombre, perfil, imagen_perfil FROM usuarios";
if ($search_query) {
    $sql .= " WHERE nombre LIKE ? OR perfil LIKE ?";
}

$stmt = $conn->prepare($sql);
if ($search_query) {
    $search_query_param = "%$search_query%";
    $stmt->bind_param("ss", $search_query_param, $search_query_param);
}
$stmt->execute();
$result = $stmt->get_result();

$profile_pictures = [];
while ($row = $result->fetch_assoc()) {
    $profile_pictures[] = $row;
}

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Explorar Perfiles - UTM 2024</title>
    <link rel="stylesheet" href="/css/explorar.css">
</head>
<body>
    <header class="header">
        <a href="/index.html" class="nav-link">Inicio</a>
        <form action="explorar_perfiles.php" method="post" class="search-form">
            <input type="text" name="search_query" placeholder="Buscar perfiles..." value="<?php echo htmlspecialchars($search_query); ?>">
            <button type="submit" name="search" class="btn-search">Buscar</button>
        </form>
        <a href="/pasantia/views/perfil_usuario.php" class="profile-link">
            <img src="<?php echo htmlspecialchars($user_profile_pic); ?>" alt="Tu perfil" class="profile-pic">
        </a>
    </header>
    <main class="profiles-container">
        <?php if (empty($profile_pictures)): ?>
            <p>No se encontraron perfiles.</p>
        <?php else: ?>
            <?php foreach ($profile_pictures as $profile): ?>
                <div class="profile-card">
                    <img src="<?php echo htmlspecialchars($profile['imagen_perfil']); ?>" alt="<?php echo htmlspecialchars($profile['nombre']); ?>" class="profile-img">
                    <h3><?php echo htmlspecialchars($profile['nombre']); ?></h3>
                    <p><?php echo htmlspecialchars($profile['perfil']); ?></p>
                    <a href="ver_perfil.php?id=<?php echo htmlspecialchars($profile['id']); ?>" class="btn-view-profile">Ver Perfil</a>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </main>
</body>
</html>
