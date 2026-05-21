import { serialize } from "cookie";

export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    res.setHeader("Set-Cookie", serialize("user_id", "", {
        httpOnly: true,
        secure: true, // Cámbialo a false si pruebas en localhost
        sameSite: "None",
        path: "/",
        expires: new Date(0) // Expira la cookie inmediatamente
    }));

    res.status(200).json({ mensaje: "Sesión cerrada correctamente" });
}
