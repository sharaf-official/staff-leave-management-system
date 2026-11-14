import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const publicUser = (u) => ({
  id: u.id,
  companyId: u.company_id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  jobTitle: u.job_title,
  managerId: u.manager_id,
  status: u.status,
  mustChangePassword: !!u.must_change_password,
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ message: "Enter email and password." });

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash)))
    return res.status(401).json({ message: "Invalid email or password." });
  if (u.status === "disabled")
    return res.status(403).json({ message: "Your account has been disabled. Contact your administrator." });
  if (u.must_change_password && u.temp_expires_at && new Date(u.temp_expires_at) < new Date())
    return res.status(403).json({ message: "Temporary password expired. Ask your admin to resend the invitation." });

  const token = jwt.sign(
    { id: u.id, companyId: u.company_id, role: u.role, email: u.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
  res.json({ token, user: publicUser(u) });
});

router.get("/me", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.auth.id]);
  if (!rows[0]) return res.status(404).json({ message: "User not found." });
  res.json({ user: publicUser(rows[0]) });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { current, next } = req.body;
  const [rows] = await pool.query(
    `SELECT u.*, c.is_demo FROM users u JOIN companies c ON c.id = u.company_id WHERE u.id = ?`,
    [req.auth.id]
  );
  const u = rows[0];
  if (!u) return res.status(404).json({ message: "User not found." });
  if (u.is_demo) return res.status(403).json({ message: "Demo accounts cannot change their password." });
  if (!(await bcrypt.compare(current || "", u.password_hash)))
    return res.status(400).json({ message: "Current password is incorrect." });
  if (!next || next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next))
    return res.status(400).json({ message: "New password needs 8+ characters with a letter and a number." });
  if (next === current) return res.status(400).json({ message: "New password must be different." });

  const hash = await bcrypt.hash(next, 10);
  await pool.query(
    "UPDATE users SET password_hash = ?, must_change_password = 0, temp_expires_at = NULL, status = 'active' WHERE id = ?",
    [hash, u.id]
  );
  res.json({ ok: true });
});

export default router;