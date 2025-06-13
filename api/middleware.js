// utils/authMiddleware.js
export async function getUserIdFromCookies(req, res) {
  if (!req.cookies || !req.cookies.user_id) {
    return null;
  }
  return req.cookies.user_id;
}
