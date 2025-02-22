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
$stmt = $conn->prepare("SELECT nombre, email, telefono, procedencia, perfil, cedula_ruc_pasaporte, ubicacion, fase, deck, descripcion, imagen_perfil, banner, password, campo_accion, email, organizacion FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($nombre, $email, $telefono, $procedencia, $perfil, $cedula_ruc_pasaporte,$ubicacion, $fase, $deck, $descripcion, $imagen_perfil, $banner, $password, $campo_accion, $email, $organizacion);
$stmt->fetch();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['update_description'])) {
        $new_description = $_POST['description'];
        $stmt = $conn->prepare("UPDATE usuarios SET descripcion = ? WHERE id = ?");
        $stmt->bind_param("si", $new_description, $user_id);
        $stmt->execute();
        header("Location: /pasantia/views/perfil_usuario.php");
        exit();
    }
    if (isset($_FILES['profile_image'])) {
        $target_dir = "/imagenes/";
        $target_file = $target_dir . basename($_FILES["profile_image"]["name"]);
        $uploadOk = 1;
        $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        $check = getimagesize($_FILES["profile_image"]["tmp_name"]);
        if ($check !== false) {
            $uploadOk = 1;
        } else {
            $uploadOk = 0;
        }

        if ($_FILES["profile_image"]["size"] > 500000) {
            $uploadOk = 0;
        }

        if ($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg" && $imageFileType != "gif") {
            $uploadOk = 0;
        }

        if ($uploadOk == 1) {
            if (move_uploaded_file($_FILES["profile_image"]["tmp_name"], $target_file)) {
                $stmt = $conn->prepare("UPDATE usuarios SET imagen_perfil = ? WHERE id = ?");
                $stmt->bind_param("si", $target_file, $user_id);
                $stmt->execute();
                header("Location: perfil_usuario.php");
                exit();
            }
        }
    }
    if (isset($_FILES['banner_image'])) {
        $target_dir = "/imagenes/";
        $target_file = $target_dir . basename($_FILES["banner_image"]["name"]);
        $uploadOk = 1;
        $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        $check = getimagesize($_FILES["banner_image"]["tmp_name"]);
        if ($check !== false) {
            $uploadOk = 1;
        } else {
            $uploadOk = 0;
        }

        if ($_FILES["banner_image"]["size"] > 1000000) {
            $uploadOk = 0;
        }

        if ($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg" && $imageFileType != "gif") {
            $uploadOk = 0;
        }

        if ($uploadOk == 1) {
            if (move_uploaded_file($_FILES["banner_image"]["tmp_name"], $target_file)) {
                $stmt = $conn->prepare("UPDATE usuarios SET banner = ? WHERE id = ?");
                $stmt->bind_param("si", $target_file, $user_id);
                $stmt->execute();
                header("Location: perfil_usuario.php");
                exit();
            }
        }
    }
    if (isset($_POST['update_password'])) {
        $old_password = $_POST['old_password'];
        $new_password = $_POST['new_password'];
        
        if (password_verify($old_password, $password)) {
            $hashed_new_password = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
            $stmt->bind_param("si", $hashed_new_password, $user_id);
            $stmt->execute();
            echo "<script>alert('Contraseña actualizada exitosamente.');</script>";
        } else {
            echo "<script>alert('Contraseña antigua incorrecta.');</script>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil - UTM 2024</title>
    <link rel="stylesheet" href="/css/perfil.css">
</head>
<body>
    <header class="profile-header">
    <a href="explorar_perfiles.php" class="btn-custom">Inicio</a>
    <div class="nav-link dropdown">
            <button class="dropbtn">Configuración</button>
            <div class="dropdown-content">
                <a href="#" id="open-password-modal">Actualizar Contraseña</a>
                <a href="editar_perfil.php">Editar Perfil</a>
                <a href="logout.php">Cerrar sesión</a>
            </div>
        </div>
    </header>
    <div class="profile-container">
        <div class="banner-container">
            <img src="<?php echo htmlspecialchars($banner); ?>" alt="Banner" class="banner-image">
            <div class="profile-image-container">
                <img src="<?php echo htmlspecialchars($imagen_perfil); ?>" alt="Imagen de perfil" class="profile-image">
                <form action="perfil_usuario.php" method="post" enctype="multipart/form-data">
                    <label for="profile-image-upload" class="file-upload-label">
                        <img src="/pasantia/imagenes/edit-icon.png" alt="Editar" class="edit-icon1">
                    </label>
                    <input type="file" id="profile-image-upload" name="profile_image" accept="image/*" style="display: none;" onchange="this.form.submit();">
                </form>
            </div>
            <form action="perfil_usuario.php" method="post" enctype="multipart/form-data">
                <label for="banner-upload" class="file-upload-label-banner">
                    <img src="/pasantia/imagenes/edit-icon.png" alt="Editar" class="edit-icon">
                </label>
                <input type="file" id="banner-upload" name="banner_image" accept="image/*" style="display: none;" onchange="this.form.submit();">
            </form>
        </div>
        <div class="profile-info">
            <h2><?php echo htmlspecialchars($nombre); ?></h2>
        </div>

        <div class="description-container">
        <p class="description"><?php echo htmlspecialchars($descripcion); ?></p>
        </div>

        <div class="additional-info">

    <h3>Información Adicional</h3>
    <p><strong>Gmail:</strong> <?php echo htmlspecialchars($email); ?></p>
    <p><strong>Teléfono:</strong> <?php echo htmlspecialchars($telefono); ?></p>
    <p><strong>Organización:</strong> <?php echo htmlspecialchars($organizacion); ?></p>
    <p><strong>Perfil:</strong> <?php echo htmlspecialchars($perfil); ?></p>
    <p><strong>ubicacion:</strong> <?php echo htmlspecialchars($ubicacion); ?></p>
    <p><strong>Fase:</strong> <?php echo htmlspecialchars($fase); ?></p>
    <p><strong>Deck:</strong> <?php echo htmlspecialchars($deck); ?></p>
    <p><strong>Procedencia:</strong> <?php echo htmlspecialchars($procedencia); ?></p>
    <p><strong>Campo de Acción:</strong> <?php echo htmlspecialchars($campo_accion); ?></p>

</div>

        <button id="add-description-btn" class="btn-add-description">Añadir Descripción</button>
        <div id="description-form" class="description-form">
            <form action="perfil_usuario.php" method="post">
                <textarea id="description" name="description" maxlength="1000" placeholder="Escribe tu descripción aquí..."><?php echo htmlspecialchars($descripcion); ?></textarea>
                <div id="char-count">1000 caracteres restantes</div>
                <button type="submit" name="update_description" class="btn-update-description">Actualizar Descripción</button>
            </form>
        </div>
    </div>


    <!-- Modal para actualizar la contraseña -->
    <div id="password-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Actualizar Contraseña</h2>
            <form action="perfil_usuario.php" method="post">
                <label for="old_password">Contraseña antigua:</label>
                <input type="password" id="old_password" name="old_password" required>
                <label for="new_password">Nueva contraseña:</label>
                <input type="password" id="new_password" name="new_password" required>
                <button type="submit" name="update_password" class="btn-update-password">Actualizar Contraseña</button>
            </form>
        </div>
    </div>

    <script>
        document.getElementById('add-description-btn').addEventListener('click', function() {
            document.getElementById('description-form').classList.toggle('show');
        });

        const textarea = document.getElementById('description');
        const charCount = document.getElementById('char-count');

        textarea.addEventListener('input', function() {
            const remaining = 1000 - textarea.value.length;
            charCount.textContent = `${remaining} caracteres restantes`;
        });

        // Modal
        var modal = document.getElementById("password-modal");
        var btn = document.getElementById("open-password-modal");
        var span = document.getElementsByClassName("close")[0];

        btn.onclick = function() {
            modal.style.display = "block";
        }

        span.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        // Dropdown menu functionality
        document.querySelector('.dropbtn').addEventListener('click', function() {
            var dropdownContent = document.querySelector('.dropdown-content');
            dropdownContent.classList.toggle('show');
        });

        // Hide dropdown when clicking outside
        window.onclick = function(event) {
            if (!event.target.matches('.dropbtn')) {
                var dropdowns = document.getElementsByClassName("dropdown-content");
                for (var i = 0; i < dropdowns.length; i++) {
                    var openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        }
    </script>
</body>
</html>

<?php
$stmt->close();
$conn->close();
?>
