import { parse } from "cookie";

export default function handler(req, res) {
    try {
        const cookies = parse(req.headers.cookie || ""); // Obtener cookies
        if (cookies.user_id) {
            return res.status(200).json({ autenticado: true });
        }
        return res.status(401).json({ autenticado: false });
    } catch (error) {
        console.error("Error al verificar la sesión:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
}
