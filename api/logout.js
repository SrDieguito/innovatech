import { serialize } from "cookie";

export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader("Set-Cookie", serialize("user_id", "", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
        path: "/",
        expires: new Date(0),
    }));

    res.status(200).json({ mensaje: "Sesión cerrada correctamente" });
}
