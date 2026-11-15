import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const map = (r) => ({
  id: r.id,
  employee: r.employee_name,
  employeeEmail: r.employee_email,
  department: r.department,
  approverName: r.manager_name,
  type: r.leave_type,
  from: r.start_date,
  to: r.end_date,
  days: r.days,
  reason: r.reason,
  status: cap(r.status),
  comment: r.decision_note || "",
  createdAt: r.created_at,
});

const SELECT = `
  SELECT l.*, u.name AS employee_name, u.email AS employee_email, u.department, m.name AS manager_name
  FROM leave_requests l
  JOIN users u ON u.id = l.user_id
  LEFT JOIN users m ON m.id = l.manager_id`;

// working days (Mon - Fri), both dates included
const workingDays = (a, b) => {
  let n = 0;
  const d = new Date(`${a}T00:00:00`);
  const end = new Date(`${b}T00:00:00`);
  while (d <= end) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
};

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

async function logMail(companyId, to, type, subject, body) {
  await pool.query(
    "INSERT INTO email_log (company_id, to_email, type, subject, body) VALUES (?,?,?,?,?)",
    [companyId, to, type, subject, body]
  );
}

async function findApprover(me) {
  if (me.manager_id) {
    const [[m]] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [me.manager_id]);
    if (m) return m;
  }
  const [[adm]] = await pool.query(
    "SELECT id, name, email FROM users WHERE company_id = ? AND role = 'admin' AND id <> ? ORDER BY id LIMIT 1",
    [me.company_id, me.id]
  );
  return adm || null;
}

// who will approve my requests
router.get("/approver", async (req, res) => {
  const [[me]] = await pool.query("SELECT * FROM users WHERE id = ?", [req.auth.id]);
  const a = await findApprover(me);
  res.json({ approver: a ? { name: a.name, email: a.email } : null });
});

// apply
router.post("/", async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!leaveType || !isDate(startDate) || !isDate(endDate))
    return res.status(400).json({ message: "Choose a leave type and dates." });
  if (endDate < startDate)
    return res.status(400).json({ message: "End date must be on or after the start date." });
  if (!reason || reason.trim().length < 10)
    return res.status(400).json({ message: "Please give a short reason (at least 10 characters)." });

  const days = workingDays(startDate, endDate);
  if (days === 0) return res.status(400).json({ message: "These dates are weekends only." });

  const [[me]] = await pool.query("SELECT * FROM users WHERE id = ?", [req.auth.id]);
  const approver = await findApprover(me);
  if (!approver) return res.status(400).json({ message: "No approver is assigned to you." });

    const [[lt]] = await pool.query(
    "SELECT days FROM leave_types WHERE company_id = ? AND name = ?",
    [me.company_id, leaveType]
  );
  if (!lt) return res.status(400).json({ message: "Unknown leave type." });

  const [[used]] = await pool.query(
    `SELECT COALESCE(SUM(days), 0) AS n FROM leave_requests
     WHERE user_id = ? AND leave_type = ? AND status IN ('pending','approved')`,
    [me.id, leaveType]
  );
  const left = lt.days - Number(used.n);
  if (days > left)
    return res.status(400).json({ message: `Not enough ${leaveType} leave. You have ${left} day(s) left.` });

  const [[clash]] = await pool.query(
    `SELECT COUNT(*) AS n FROM leave_requests
     WHERE user_id = ? AND status IN ('pending','approved') AND start_date <= ? AND end_date >= ?`,
    [me.id, endDate, startDate]
  );
  if (clash.n > 0)
    return res.status(400).json({ message: "You already have a request on these dates." });
  const [r] = await pool.query(
    `INSERT INTO leave_requests (company_id, user_id, manager_id, leave_type, start_date, end_date, days, reason)
     VALUES (?,?,?,?,?,?,?,?)`,
    [me.company_id, me.id, approver.id, leaveType, startDate, endDate, days, reason.trim()]
  );

  await logMail(
    me.company_id, approver.email, "leave_request",
    `Leave request: ${me.name} - ${leaveType} leave`,
`Hi ${approver.name.split(" ")[0]},

${me.name}${me.department ? ` (${me.department})` : ""} has requested leave and is waiting for your decision.

Leave type: ${leaveType}
Dates: ${startDate}${startDate !== endDate ? ` to ${endDate}` : ""}
Working days: ${days}
Reason: ${reason.trim()}

Review and decide: ${req.headers.origin || "http://localhost:5173"}/approvals

- Leave Nest`
  );
  res.status(201).json({ id: r.insertId, days });
});

// my history
router.get("/mine", async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE l.user_id = ? ORDER BY l.id DESC`, [req.auth.id]);
  res.json({ leaves: rows.map(map) });
});

// manager: their team, admin: whole company
router.get("/", requireRole("manager", "admin"), async (req, res) => {
  const [rows] =
    req.auth.role === "admin"
      ? await pool.query(`${SELECT} WHERE l.company_id = ? ORDER BY l.id DESC`, [req.auth.companyId])
      : await pool.query(`${SELECT} WHERE l.manager_id = ? ORDER BY l.id DESC`, [req.auth.id]);
  res.json({ leaves: rows.map(map) });
});

// cancel my own pending request
router.patch("/:id/cancel", async (req, res) => {
  const [r] = await pool.query(
    "UPDATE leave_requests SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'",
    [req.params.id, req.auth.id]
  );
  if (!r.affectedRows) return res.status(400).json({ message: "Only your pending requests can be cancelled." });
  res.json({ ok: true });
});

// approve / reject
router.patch("/:id/decision", requireRole("manager", "admin"), async (req, res) => {
  const { status, note } = req.body;
  if (!["approved", "rejected"].includes(status))
    return res.status(400).json({ message: "Invalid decision." });
  if (status === "rejected" && (!note || !note.trim()))
    return res.status(400).json({ message: "Please enter a comment when rejecting a request." });

  const [[l]] = await pool.query(`${SELECT} WHERE l.id = ? AND l.company_id = ?`, [req.params.id, req.auth.companyId]);
  if (!l) return res.status(404).json({ message: "Request not found." });
  if (req.auth.role === "manager" && l.manager_id !== req.auth.id)
    return res.status(403).json({ message: "This request is not assigned to you." });
  if (l.status !== "pending") return res.status(400).json({ message: "This request was already decided." });

  await pool.query(
    "UPDATE leave_requests SET status = ?, decision_note = ?, decided_at = NOW() WHERE id = ?",
    [status, note?.trim() || null, l.id]
  );
  const [[by]] = await pool.query("SELECT name FROM users WHERE id = ?", [req.auth.id]);
  await logMail(
    l.company_id, l.employee_email, "decision",
    `Your leave request was ${status}`,
`Hi ${l.employee_name.split(" ")[0]},

${by.name} has ${status} your ${l.leave_type} leave request (${l.start_date} to ${l.end_date}, ${l.days} working day${l.days > 1 ? "s" : ""}).
${note?.trim() ? `\nComment: ${note.trim()}\n` : ""}
You can see the details under My history in Leave Nest.

- Leave Nest Team`
  );
  res.json({ ok: true });
});

export default router;