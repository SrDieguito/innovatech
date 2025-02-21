<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Incluir los archivos necesarios de PHPMailer
require '../vendor/autoload.php'; // Si usas Composer
date_default_timezone_set('America/Guayaquil');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pasantia";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

if (isset($_GET['id'])) {
    $usuario_id = $_GET['id'];

    // Generar una contraseña aleatoria
    $password_random = bin2hex(random_bytes(4)); // Contraseña de 8 caracteres
    $hashed_password = password_hash($password_random, PASSWORD_DEFAULT);

    // Asignar la imagen de perfil por defecto
    $default_image = 'imagenes/default.png';

    // Obtener la fecha y hora actuales para `fecha_actualizacion`
    $fecha_actual = date('Y-m-d H:i:s');

    // Actualizar usuario en la base de datos como aprobado y registrar la fecha de actualización
    $sql = "UPDATE usuarios 
            SET aprobado = 1, 
                password = '$hashed_password', 
                imagen_perfil = '$default_image', 
                estado = 'aprobado', 
                fecha_actualizacion = '$fecha_actual' 
            WHERE id = $usuario_id";
    
    if ($conn->query($sql) === TRUE) {
        // Obtener el email del usuario
        $result = $conn->query("SELECT email FROM usuarios WHERE id = $usuario_id");
        $row = $result->fetch_assoc();
        $email = $row['email'];

        // Configurar PHPMailer
        $mail = new PHPMailer(true);
        try {
            // Configuraciones del servidor SMTP
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';  // El servidor SMTP que uses (puedes usar smtp.gmail.com para Gmail)
            $mail->SMTPAuth = true;
            $mail->Username = 'crafteo727@gmail.com';  // Tu dirección de correo SMTP
            $mail->Password = 'ctppcsvfcyswyfge';  // Tu contraseña SMTP
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Destinatarios
            $mail->setFrom('crafteo727@gmail.com', 'UTM 2024');
            $mail->addAddress($email);  // Añadir el correo del usuario aprobado

            // Contenido del correo
            $mail->isHTML(true);
            $mail->Subject = 'Aprobacion de Registro';

            // Cuerpo del correo con formato HTML
            $mail->Body    = '
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #333;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 90%;
                        max-width: 600px;
                        margin: auto;
                        background: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .header img {
                        max-width: 100%;
                        height: auto;
                    }
                    .content {
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        font-size: 0.9em;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://images.app.goo.gl/Btwo8ZtrxDqsDsiGA" alt="Logo de UTM 2024">
                    </div>
                    <div class="content">
                        <p>Hola, buenas tardes,</p>
                        <p>Te saluda el equipo de UTM 2024. Queremos informarte que tu solicitud ha sido aprobada.</p>
                        <p><strong>Tu contraseña temporal es:</strong> <b>' . htmlspecialchars($password_random) . '</b></p>
                        <p>Por favor, utiliza esta contraseña para acceder a tu cuenta. Te recomendamos que la cambies una vez inicies sesión.</p>
                        <p>Saludos,<br>El equipo de UTM 2024</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 UTM 2024. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            ';

            // Enviar el correo
            $mail->send();
            // Redirige de vuelta al panel de administración con un mensaje de éxito
            header("Location: ../admin/interfaz_administracion.php?status=success");
        } catch (Exception $e) {
            echo "No se pudo enviar el correo. Error: {$mail->ErrorInfo}";
        }
    } else {
        echo "Error: " . $conn->error;
    }
}

$conn->close();
?>
