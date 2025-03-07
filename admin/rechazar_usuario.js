import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/reject-user", (req, res) => {
    const userId = req.query.id;
    if (!userId || isNaN(userId)) {
        return res.status(400).send("Error: ID de usuario no válido.");
    }

    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rechazar Usuario - UTM 2024</title>
        <link rel="stylesheet" href="/css/admin.css">
    </head>
    <body>
        <header>
            <h1>Rechazar Usuario</h1>
            <nav>
                <a href="/index.html" class="btn-back">Regresar al Panel</a>
            </nav>
        </header>
        <main>
            <h2>Motivo del Rechazo</h2>
            <form action="/api/process-rejection" method="post">
                <input type="hidden" name="user_id" value="${userId}">
                <label for="rejection_reason">Motivo del rechazo:</label>
                <textarea id="rejection_reason" name="rejection_reason" rows="4" required></textarea>
                <button type="submit" class="btn-reject">Enviar Rechazo</button>
            </form>
        </main>
    </body>
    </html>
    `);
});

export default app;
