import { parse } from "cookie";

export default function handler(req, res) {
    const cookies = parse(req.headers.cookie || "");

    if (cookies.token) {
        res.status(200).json({ autenticado: true });
    } else {
        res.status(401).json({ autenticado: false });
    }
}
