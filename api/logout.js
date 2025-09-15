import { clearSessionCookie } from "./_utils/session.js";

export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    // Establecer la cookie de sesión para que expire inmediatamente
    res.setHeader("Set-Cookie", clearSessionCookie());
    
    res.status(200).json({ 
        success: true,
        mensaje: "Sesión cerrada correctamente" 
    });
}
