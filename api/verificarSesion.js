export default function handler(req, res) {
    if (req.session && req.session.user_id) {
        res.status(200).json({ autenticado: true });
    } else {
        res.status(401).json({ autenticado: false });
    }
}
