<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - UTM 2024</title>
    <link rel="stylesheet" href="/pasantia/css/login.css">
</head>
<body>
    <div class="login-container">
        <img src="/pasantia/imagenes/logo.png" alt="Logo" class="logo">
        <h2>Iniciar Sesión</h2>
        
        <!-- Botón de regresar -->
        <a href="/pasantia/public/index.html" class="btn-regresar">Regresar</a>
        
        <!-- Mostrar mensaje de error si existe -->
        <?php if (isset($_GET['error'])): ?>
            <p class="error-message"><?php echo htmlspecialchars($_GET['error']); ?></p>
        <?php endif; ?>
        
        <form action="procesar_login.php" method="post">
            <div class="input-box">
                <input type="email" name="email" placeholder="Email" required>
            </div>
            <div class="input-box">
                <input type="password" name="password" placeholder="Contraseña" required>
            </div>
            <button type="submit" class="btn-login">Entrar</button>
        </form>
    </div>

</body>
</html>
