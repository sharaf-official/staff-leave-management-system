import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { deliver } from "../mailer.js";

export const outboxRouter = Router();
const router = Router();
router.use(requireAuth);
outboxRouter.use(requireAuth);

const pick = (chars, n) => Array.from(crypto.randomBytes(n), (b) => chars[b % chars.length]).join("");
const makeTemp = () =>
  `Nest-${pick("abcdefghjkmnpqrstuvwxyz23456789", 4)}-${pick("ABCDEFGHJKLMNPQRSTUVWXYZ", 2)}${pick("23456789", 2)}`;

const mapUser = (u) => ({
  id: u.id, companyId: u.company_id, name: u.name, email: u.email, role: u.role,
  department: u.department, jobTitle: u.job_title, phone: u.phone,
  managerId: u.manager_id, joinDate: u.join_date, status: u.status,
  mustChangePassword: !!u.must_change_password,
});

async function logMail(companyId, to, type, subject, body) {
  await pool.query(
    "INSERT INTO email_log (company_id, to_email, type, subject, body) VALUES (?,?,?,?,?)",
    [companyId, to, type, subject, body]
  );
  const [[c]] = await pool.query("SELECT name, email FROM companies WHERE id = ?", [companyId]);
  deliver({ fromName: c?.name || "Leave Nest", replyTo: c?.email || undefined, to, subject, text: body });
}

function invitation(user, companyName, temp, invitedBy, origin) {
  const roleText = user.role === "admin" ? "an administrator" : user.role === "manager" ? "a manager" : "an employee";
  return {
    subject: `You're invited to ${companyName} on Leave Nest`,
    body: `Hi ${user.name.split(" ")[0]},

${invitedBy} has added you to ${companyName} as ${roleText} on Leave Nest.

Sign in here: ${origin}/login
Email: ${user.email}
Temporary password: ${temp}

For your security you must change this password the first time you sign in.
The temporary password expires in 7 days.

If you were not expecting this email, please ignore it.

- Leave Nest Team`,
  };
}

const originOf = (req) => req.headers.origin || "http://localhost:5173";

// list company users
router.get("/", requireRole("admin", "manager"), async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE company_id = ? ORDER BY id", [req.auth.companyId]);
  res.json({ users: rows.map(mapUser) });
});

// add employee
router.post("/", requireRole("admin"), async (req, res) => {
  const d = req.body;
  const email = String(d.email || "").trim().toLowerCase();
  if (!d.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Enter a name and a valid email." });
  if (!["admin", "manager", "employee"].includes(d.role))
    return res.status(400).json({ message: "Invalid role." });
  if (d.role === "employee" && !d.managerId)
    return res.status(400).json({ message: "Select a reporting manager." });

  const [dup] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (dup.length) return res.status(409).json({ message: "This email is already registered." });

  const temp = d.tempPassword && d.tempPassword.length >= 8 ? d.tempPassword : makeTemp();
  const hash = await bcrypt.hash(temp, 10);
  const [r] = await pool.query(
    `INSERT INTO users (company_id,name,email,password_hash,role,department,job_title,phone,manager_id,join_date,status,must_change_password,temp_expires_at)
     VALUES (?,?,?,?,?,?,?,?,?,?, 'invited', 1, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [req.auth.companyId, d.name.trim(), email, hash, d.role, d.department?.trim() || null,
     d.jobTitle?.trim() || null, d.phone?.trim() || null,
     d.role === "employee" ? Number(d.managerId) : null, d.joinDate || new Date()]
  );
  const [[user]] = await pool.query("SELECT * FROM users WHERE id = ?", [r.insertId]);
  const [[company]] = await pool.query("SELECT name FROM companies WHERE id = ?", [req.auth.companyId]);
  const [[admin]] = await pool.query("SELECT name FROM users WHERE id = ?", [req.auth.id]);
  const mail = invitation(user, company.name, temp, admin.name, originOf(req));
  await logMail(req.auth.companyId, email, "invitation", mail.subject, mail.body);
  res.status(201).json({ user: mapUser(user) });
});

// edit
router.put("/:id", requireRole("admin"), async (req, res) => {
  const d = req.body;
  const [r] = await pool.query(
    `UPDATE users SET name=?, job_title=?, department=?, role=?, manager_id=?, phone=?
     WHERE id=? AND company_id=?`,
    [d.name.trim(), d.jobTitle?.trim() || null, d.department?.trim() || null, d.role,
     d.role === "employee" ? Number(d.managerId) || null : null, d.phone?.trim() || null,
     req.params.id, req.auth.companyId]
  );
  if (!r.affectedRows) return res.status(404).json({ message: "User not found." });
  res.json({ ok: true });
});

// disable / enable
router.patch("/:id/status", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.auth.id) return res.status(400).json({ message: "You cannot disable yourself." });
  const [[u]] = await pool.query("SELECT * FROM users WHERE id=? AND company_id=?", [id, req.auth.companyId]);
  if (!u) return res.status(404).json({ message: "User not found." });
  const status = req.body.disabled ? "disabled" : u.must_change_password ? "invited" : "active";
  await pool.query("UPDATE users SET status=? WHERE id=?", [status, id]);
  res.json({ ok: true, status });
});

// resend invitation
router.post("/:id/resend", requireRole("admin"), async (req, res) => {
  const [[u]] = await pool.query("SELECT * FROM users WHERE id=? AND company_id=?", [req.params.id, req.auth.companyId]);
  if (!u) return res.status(404).json({ message: "User not found." });
  const temp = makeTemp();
  await pool.query(
    "UPDATE users SET password_hash=?, must_change_password=1, status='invited', temp_expires_at=DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id=?",
    [await bcrypt.hash(temp, 10), u.id]
  );
  const [[company]] = await pool.query("SELECT name FROM companies WHERE id=?", [u.company_id]);
  const [[admin]] = await pool.query("SELECT name FROM users WHERE id=?", [req.auth.id]);
  const mail = invitation(u, company.name, temp, admin.name, originOf(req));
  await logMail(u.company_id, u.email, "invitation", mail.subject, mail.body);
  res.json({ ok: true, tempPassword: temp });  
});

// email outbox
outboxRouter.get("/", async (req, res) => {
  const isAdmin = req.auth.role === "admin";
  const [rows] = isAdmin
    ? await pool.query("SELECT * FROM email_log WHERE company_id=? ORDER BY id DESC LIMIT 200", [req.auth.companyId])
    : await pool.query("SELECT * FROM email_log WHERE company_id=? AND to_email=? ORDER BY id DESC LIMIT 200", [req.auth.companyId, req.auth.email]);
  res.json({
    mails: rows.map((m) => ({ id: m.id, type: m.type, to: m.to_email, subject: m.subject, body: m.body, createdAt: m.created_at })),
  });
});

outboxRouter.delete("/", requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM email_log WHERE company_id=?", [req.auth.companyId]);
  res.json({ ok: true, tempPassword: temp });
});

export default router;