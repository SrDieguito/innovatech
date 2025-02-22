<?php
session_start(); // Inicia la sesión

// Verifica si el usuario está autenticado y tiene el rol de admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_rol'] !== 'admin') {
    // Redirige a la página de inicio de sesión si no está autenticado o no es admin
    header("Location: /auth/login.html?error=" . urlencode("Acceso no autorizado."));
    exit();
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '/vendor/autoload.php'; // Asegúrate de que esta ruta sea correcta
date_default_timezone_set('America/Guayaquil');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pasantia";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Verifica si se ha enviado el ID de usuario y el motivo del rechazo
if (!isset($_POST['user_id']) || !isset($_POST['rejection_reason'])) {
    die("Error: Falta información para procesar la solicitud.");
}

$user_id = intval($_POST['user_id']);
$rejection_reason = $_POST['rejection_reason'];

// Obtener el email del usuario
$sql = "SELECT email FROM usuarios WHERE id = $user_id";
$result = $conn->query($sql);
if ($result->num_rows == 0) {
    die("Error: Usuario no encontrado.");
}
$user = $result->fetch_assoc();
$email = $user['email'];

// Actualiza el estado del usuario a rechazado, guarda el motivo y la fecha de actualización
$sql = "UPDATE usuarios SET estado = 'rechazado', motivo_rechazo = ?, fecha_actualizacion = NOW() WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('si', $rejection_reason, $user_id);

if (!$stmt->execute()) {
    die("Error al actualizar el estado del usuario: " . $conn->error);
}
$stmt->close();

// Envía un correo electrónico al usuario informando el rechazo
$mail = new PHPMailer(true);
try {
    // Configuración del servidor SMTP
    $mail->isSMTP();                                            
    $mail->Host = 'smtp.gmail.com';  // El servidor SMTP que uses (puedes usar smtp.gmail.com para Gmail)
    $mail->SMTPAuth = true;                                   
    $mail->Username = 'crafteo727@gmail.com';  // Tu dirección de correo SMTP
    $mail->Password = 'ctppcsvfcyswyfge';             // Tu contraseña SMTP
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         
    $mail->Port = 587;   

    // Remitente y destinatario
    $mail->setFrom('crafteo727@gmail.com', 'Innova');
    $mail->addAddress($email);

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = 'Solicitud de Participación Rechazada';
    $mail->Body    = '<p>Estimado usuario,</p><p>Su solicitud ha sido rechazada por el siguiente motivo:</p><p>' . htmlspecialchars($rejection_reason) . '</p><p>Saludos cordiales,</p><p>El equipo de UTM 2024</p>';

    $mail->send();
} catch (Exception $e) {
    die("Error al enviar el correo: " . $mail->ErrorInfo);
}

// Redirige de vuelta al panel de administración con un mensaje de éxito
header("Location:/admin/interfaz_administracion.php?mensaje=" . urlencode("Usuario rechazado correctamente."));
exit();

?>
