export default function handler(req, res) {
    res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; Max-Age=0"); // Elimina la cookie
    res.status(200).json({ message: "Sesión cerrada" });
}
