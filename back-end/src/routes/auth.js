import crypto from "crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

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

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
const clean = (s) => String(s || "").trim();

// e.g. Nest-k7mq-XA42 (always has letters and numbers)
const tempPassword = () => {
  const pick = (chars, n) =>
    Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join("");
  return `Nest-${pick("abcdefghjkmnpqrstuvwxyz23456789", 4)}-${pick("ABCDEFGHJKMNPQRSTUVWXYZ", 2)}${pick("23456789", 2)}`;
};

router.post("/login", loginLimiter, async (req, res) => {
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

// public: a company registers itself with one admin and one manager
router.post("/register-company", async (req, res) => {
  const { company = {}, admin = {}, manager = {} } = req.body;
  const cName = clean(company.name);
  const adminName = clean(admin.name);
  const adminEmail = clean(admin.email).toLowerCase();
  const managerName = clean(manager.name);
  const managerEmail = clean(manager.email).toLowerCase();
  const managerDept = clean(manager.department);

  if (!cName) return res.status(400).json({ message: "Enter the company name." });
  if (!adminName || !emailOk(adminEmail))
    return res.status(400).json({ message: "Admin name and a valid admin email are required." });
  if (!managerName || !emailOk(managerEmail) || !managerDept)
    return res.status(400).json({ message: "Manager name, a valid manager email and department are required." });
  if (adminEmail === managerEmail)
    return res.status(400).json({ message: "Manager email must be different from the admin email." });

  const [taken] = await pool.query("SELECT email FROM users WHERE email IN (?, ?)", [adminEmail, managerEmail]);
  if (taken.length) {
    const who = taken[0].email === adminEmail ? "Admin" : "Manager";
    return res.status(409).json({ message: `${who} email is already registered. Use a different email.` });
  }

  const origin = req.headers.origin || "http://localhost:5173";
  const people = [
    { role: "Admin", dbRole: "admin", name: adminName, email: adminEmail, department: "Administration", jobTitle: "Administrator" },
    { role: "Manager", dbRole: "manager", name: managerName, email: managerEmail, department: managerDept, jobTitle: "Manager" },
  ];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [c] = await conn.query(
      `INSERT INTO companies (name, registration_no, industry, size, phone, email, address, city, country, is_demo)       VALUES (?,?,?,?,?,?,?,?,?,0)`,
      [cName, clean(company.registrationNo), clean(company.industry), clean(company.size), clean(company.phone),
       clean(company.email).toLowerCase(), clean(company.address), clean(company.city), clean(company.country) || "Sri Lanka"]
    );
    const companyId = c.insertId;
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const mails = [];
    const recipients = [];

    for (const p of people) {
      const temp = tempPassword();
      const hash = await bcrypt.hash(temp, 10);
      await conn.query(
        `INSERT INTO users (company_id, name, email, password_hash, role, department, job_title, status, must_change_password, temp_expires_at)
         VALUES (?,?,?,?,?,?,?,'invited',1,?)`,
        [companyId, p.name, p.email, hash, p.dbRole, p.department, p.jobTitle, expires]
      );
      const subject = `You have been invited to ${cName} on Leave Nest`;
      const body =
`Hi ${p.name.split(" ")[0]},

${cName} has been registered on Leave Nest and you are the ${p.role.toLowerCase()}.

Sign in: ${origin}/login
Email: ${p.email}
Temporary password: ${temp}

You must change this password the first time you sign in. It is valid for 7 days.

- Leave Nest Team`;
      const [m] = await conn.query(
        "INSERT INTO email_log (company_id, to_email, type, subject, body) VALUES (?,?,?,?,?)",
        [companyId, p.email, "invitation", subject, body]
      );
      mails.push({ id: m.insertId, to: p.email, subject, body });
      recipients.push({ role: p.role, name: p.name, email: p.email });
    }

    for (const [n, d] of [["Annual", 14], ["Sick", 7], ["Casual", 5]]) {
      await conn.query("INSERT IGNORE INTO leave_types (company_id, name, days) VALUES (?,?,?)", [companyId, n, d]);
    }

    await conn.commit();
    res.status(201).json({ company: { id: companyId, name: cName }, recipients, mails });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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
  const DEMO_EMAILS = ["admin@company.com", "manager@company.com", "employee@company.com"];
  if (DEMO_EMAILS.includes(u.email)) return res.status(403).json({ message: "Demo accounts cannot change their password." });
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