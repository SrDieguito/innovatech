<?php
session_start(); // Inicia la sesión

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pasantia";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);

    // Buscar el usuario en la base de datos
    $sql = "SELECT id, nombre, password, rol FROM usuarios WHERE email = ? AND aprobado = 1"; // Solo usuarios aprobados
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();
        $hashed_password = $row['password'];

        // Verificar la contraseña
        if (password_verify($password, $hashed_password)) {
            // Guardar la información del usuario en la sesión
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['user_name'] = $row['nombre'];
            $_SESSION['user_rol'] = $row['rol'];

            // Redirigir según el rol del usuario
            if ($row['rol'] === 'admin') {
                header("Location: /admin/interfaz_administracion.js"); // Redirige al panel de administración
            } else {
                header("Location: /views/perfil_usuario.js"); // Redirige al perfil del usuario
            }
            exit();
        } else {
            // Redirigir con mensaje de error
            $error = urlencode("Contraseña incorrecta.");
            header("Location: /auth/login.html?error=$error");
            exit();
        }
    } else {
        // Redirigir con mensaje de error
        $error = urlencode("No se encontró el usuario o la cuenta no está aprobada.");
        header("Location: /auth/login.html?error=$error");
        exit();
    }

    $stmt->close();
}

$conn->close();
?>
