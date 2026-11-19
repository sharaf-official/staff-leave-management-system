import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// these paths stay open while a password change is still pending (relative to /api/auth)
const OPEN_WHEN_MUST_CHANGE = ["/me", "/change-password"];

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not signed in." });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  try {
    const [[u]] = await pool.query(
      "SELECT status, must_change_password FROM users WHERE id = ?",
      [payload.id]
    );
    if (!u) return res.status(401).json({ message: "Account not found. Please sign in again." });
    if (u.status === "disabled")
      return res.status(403).json({ message: "Your account has been disabled. Contact your administrator." });

    const onAuthRouter = req.baseUrl === "/api/auth";
    if (u.must_change_password && !(onAuthRouter && OPEN_WHEN_MUST_CHANGE.includes(req.path)))
      return res.status(403).json({ message: "You must change your temporary password first." });

    req.auth = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.auth.role) ? next() : res.status(403).json({ message: "Not allowed." });
}