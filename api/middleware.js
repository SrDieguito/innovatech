// utils/authMiddleware.js
export async function authMiddleware(req, res) {
  if (!req.cookies || !req.cookies.user_id) {
    res.status(401).json({ error: "No autorizado" });
    return null;
  }
  return req.cookies.user_id;
}
