import { parse } from "cookie";

export default function handler(req, res) {
    try {
        // Asegúrate de que existen cookies
        if (!req.headers.cookie) {
            return res.status(401).json({ autenticado: false, mensaje: "No autorizado" });
        }

        // Parsea las cookies
        const cookies = parse(req.headers.cookie);
        
        // Verifica si user_id existe
        if (cookies.user_id) {
            return res.status(200).json({ autenticado: true });
        }

        return res.status(401).json({ autenticado: false, mensaje: "Sesión no válida" });
    } catch (error) {
        console.error("Error al verificar la sesión:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
}
