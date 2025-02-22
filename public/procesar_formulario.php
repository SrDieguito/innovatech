<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '/vendor/autoload.php'; // Asegúrate de que la ruta sea correcta
date_default_timezone_set('America/Guayaquil'); // Cambia esto por tu zona horaria si es diferente

// Conectar a la base de datos
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pasantia";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Recoger datos del formulario
$nombre = trim($_POST['nombre']);
$email = trim($_POST['email']);
$telefono = trim($_POST['telefono']);
$perfil = trim($_POST['perfil']);
$organizacion = trim($_POST['organizacion']);
$cedula_ruc_pasaporte = trim($_POST['cedula_ruc_pasaporte']);
$ubicacion = trim($_POST['ubicacion']);
$fase = isset($_POST['fase']) ? $_POST['fase'] : '';
$pitches = trim($_POST['pitches']);
$deck = trim($_POST['deck']);
$descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
$campo_accion = trim($_POST['campo_accion']); // Este valor puede ser "Otros" o uno de los valores predefinidos

// Obtener la fecha actual
$fecha_actualizacion = date('Y-m-d H:i:s'); // Fecha actual

// Verificar si el email ya está registrado
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    // Si el email ya existe, redirigir al formulario con un mensaje de error
    header("Location: /public/formulario.html?error=" . urlencode("El correo electrónico ya está registrado."));
    exit();
}

// Insertar datos en la base de datos
$sql = "INSERT INTO usuarios (nombre, email, telefono, perfil, organizacion, cedula_ruc_pasaporte, ubicacion, fase, pitches, deck, descripcion, campo_accion, fecha_actualizacion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sssssssssssss", $nombre, $email, $telefono, $perfil, $organizacion, $cedula_ruc_pasaporte, $ubicacion, $fase, $pitches, $deck, $descripcion, $campo_accion, $fecha_actualizacion);

if ($stmt->execute()) {
    // Enviar notificación por correo electrónico al administrador usando PHPMailer
    $mail = new PHPMailer(true);

    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();                                            
        $mail->Host = 'smtp.gmail.com';  
        $mail->SMTPAuth = true;                                   
        $mail->Username = 'crafteo727@gmail.com';  
        $mail->Password = 'ctppcsvfcyswyfge';  
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         
        $mail->Port = 587;                                   

        // Destinatarios
        $mail->setFrom('crafteo727@gmail.com', 'UTM 2024');
        $mail->addAddress('g4141223@gmail.com', 'Admin');  

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = 'Nuevo registro de usuario';
        $mail->Body    = "El usuario $nombre ($email) ha solicitado registrarse. Por favor, revisa y aprueba o rechaza la solicitud en el perfil de administrador.";
        $mail->AltBody = "El usuario $nombre ($email) ha solicitado registrarse. Por favor, revisa y aprueba o rechaza la solicitud en el perfil de administrador.";

        $mail->send();
        
        // Redirigir al formulario con mensaje de éxito
        header("Location: /public/formulario.html?success=" . urlencode("Registro enviado correctamente. Un administrador revisará tu solicitud."));
        exit();
    } catch (Exception $e) {
        // Redirigir al formulario con mensaje de error si falla el envío de correo
        header("Location: /public/formulario.html?error=" . urlencode("Error al enviar el mensaje. Mailer Error: {$mail->ErrorInfo}"));
        exit();
    }
} else {
    // Redirigir al formulario con mensaje de error si falla la inserción en la base de datos
    header("Location: /public/formulario.html?error=" . urlencode("Error al registrar los datos: " . $conn->error));
    exit();
}

$conn->close();
?>
