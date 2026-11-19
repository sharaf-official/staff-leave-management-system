import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../notify.js";
import { deliver } from "../mailer.js";

const router = Router();
router.use(requireAuth);

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/* ---------- time helpers ---------- */
const OFFICE_START = "09:00";
const OFFICE_END = "17:00";
const MIDDAY = "13:00";
const hhmm = (t) => (t ? String(t).slice(0, 5) : "");
const isTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s));
const minutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const t12 = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

// real start and end time of a request (older half-day rows only stored a session)
const timesOf = (r) => {
  const s = hhmm(r.start_time) || OFFICE_START;
  const e = hhmm(r.end_time) || OFFICE_END;
  if (s === OFFICE_START && e === OFFICE_END) {
    if (r.session === "morning") return [OFFICE_START, MIDDAY];
    if (r.session === "afternoon") return [MIDDAY, OFFICE_END];
  }
  return [s, e];
};

const dayText = (a, b) => (a === b ? a : `${a} to ${b}`);

// up to 4 hours = half day, more = 1 day
const dayPart = (mins) => (mins <= 0 ? 0 : mins <= 240 ? 0.5 : 1);

// leave from (date + time) to (date + time); weekends are skipped, a working day is 9:00 - 17:00
const leaveDays = (startDate, endDate, startTime, endTime) => {
  const first = new Date(`${startDate}T00:00:00`).getTime();
  const last = new Date(`${endDate}T00:00:00`).getTime();
  let total = 0;
  for (const d = new Date(first); d.getTime() <= last; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    const t = d.getTime();
    const s = t === first ? minutes(startTime) : 540;
    const e = t === last ? minutes(endTime) : 1020;
    total += dayPart(e - s);
  }
  return total;
};

const hasWeekday = (a, b) => {
  const d = new Date(`${a}T00:00:00`);
  const end = new Date(`${b}T00:00:00`);
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) return true;
    d.setDate(d.getDate() + 1);
  }
  return false;
};

/* ---------- mapping ---------- */
const map = (r) => {
  const [startTime, endTime] = timesOf(r);
  return {
    id: r.id,
    employee: r.employee_name,
    employeeEmail: r.employee_email,
    department: r.department,
    approverName: r.manager_name,
    type: r.leave_type,
    from: r.start_date,
    to: r.end_date,
    startTime,
    endTime,
    days: Number(r.days),
    session: r.session || "full",
    reason: r.reason,
    status: cap(r.status),
    comment: r.decision_note || "",
    createdAt: r.created_at,
  };
};

const SELECT = `
  SELECT l.*, u.name AS employee_name, u.email AS employee_email, u.department, m.name AS manager_name
  FROM leave_requests l
  JOIN users u ON u.id = l.user_id
  LEFT JOIN users m ON m.id = l.manager_id`;

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

async function logMail(companyId, to, type, subject, body) {
  await pool.query(
    "INSERT INTO email_log (company_id, to_email, type, subject, body) VALUES (?,?,?,?,?)",
    [companyId, to, type, subject, body]
  );
  // real email (does nothing when MAIL_ENABLED is not "true"; never throws)
  deliver({ fromName: "Leave Nest", to, subject, text: body });
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
  if (!hasWeekday(startDate, endDate)) return res.status(400).json({ message: "These dates are weekends only." });

  const startTime = req.body.startTime || OFFICE_START;
  const endTime = req.body.endTime || OFFICE_END;
  if (!isTime(startTime) || !isTime(endTime))
    return res.status(400).json({ message: "Enter a valid start and end time." });
  if (minutes(startTime) < 540 || minutes(endTime) > 1020)
    return res.status(400).json({ message: "Choose a time between 9:00 AM and 5:00 PM." });
  if (startDate === endDate && minutes(endTime) - minutes(startTime) < 60)
    return res.status(400).json({ message: "The end time must be at least 1 hour after the start time." });

  const days = leaveDays(startDate, endDate, startTime, endTime);
  if (days === 0) return res.status(400).json({ message: "There is no working time between these dates and times." });

  // session is only used by older screens
  let session = "full";
  if (startDate === endDate && days === 0.5) session = minutes(startTime) < 720 ? "morning" : "afternoon";

  const [[me]] = await pool.query("SELECT * FROM users WHERE id = ?", [req.auth.id]);
  const approver = await findApprover(me);
  if (!approver) return res.status(400).json({ message: "No approver is assigned to you." });

  // leave type must exist and balance must be enough
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
  const left = Number(lt.days) - Number(used.n);
  if (days > left)
    return res.status(400).json({ message: `Not enough ${leaveType} leave. You have ${left} day(s) left.` });

  // overlap: the two date+time ranges must not overlap
  const [clashes] = await pool.query(
    `SELECT start_date, end_date, session, start_time, end_time FROM leave_requests
     WHERE user_id = ? AND status IN ('pending','approved') AND start_date <= ? AND end_date >= ?`,
    [me.id, endDate, startDate]
  );
  const a0 = `${startDate} ${startTime}`;
  const a1 = `${endDate} ${endTime}`;
  const blocked = clashes.some((c) => {
    const [cs, ce] = timesOf(c);
    return a0 < `${String(c.end_date).slice(0, 10)} ${ce}` && `${String(c.start_date).slice(0, 10)} ${cs}` < a1;
  });
  if (blocked)
    return res.status(400).json({ message: "You already have a request that overlaps these dates or times." });

  const [r] = await pool.query(
    `INSERT INTO leave_requests (company_id, user_id, manager_id, leave_type, start_date, end_date, start_time, end_time, days, session, reason)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [me.company_id, me.id, approver.id, leaveType, startDate, endDate, startTime, endTime, days, session, reason.trim()]
  );

  const single = startDate === endDate;
  const when = single ? `${startDate}, ${t12(startTime)} to ${t12(endTime)}` : `${startDate} ${t12(startTime)} to ${endDate} ${t12(endTime)}`;

  await logMail(
    me.company_id, approver.email, "leave_request",
    `Leave request: ${me.name} - ${leaveType} leave`,
`Hi ${approver.name.split(" ")[0]},

${me.name}${me.department ? ` (${me.department})` : ""} has requested leave and is waiting for your decision.

Leave type: ${leaveType}
From: ${startDate}, ${t12(startTime)}
To: ${endDate}, ${t12(endTime)}
Working days: ${days}
Reason: ${reason.trim()}

Review and decide: ${req.headers.origin || "http://localhost:5173"}/approvals

- Leave Nest`
  );

  await notify({
    companyId: me.company_id,
    userId: approver.id,
    type: "leave_request",
    title: "New leave request",
    message: `${me.name} requested ${leaveType} leave (${when}).`.slice(0, 255),
    link: "/approvals",
  });

  res.status(201).json({ id: r.insertId, days, session, startTime, endTime });
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
  const [[l]] = await pool.query(`${SELECT} WHERE l.id = ? AND l.user_id = ? AND l.status = 'pending'`, [
    req.params.id,
    req.auth.id,
  ]);
  if (!l) return res.status(400).json({ message: "Only your pending requests can be cancelled." });

  await pool.query("UPDATE leave_requests SET status = 'cancelled' WHERE id = ?", [l.id]);
  if (l.manager_id)
    await notify({
      companyId: l.company_id,
      userId: l.manager_id,
      type: "cancelled",
      title: "Leave request cancelled",
      message: `${l.employee_name} cancelled their ${l.leave_type} leave (${dayText(l.start_date, l.end_date)}).`,
      link: "/approvals",
    });
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

  const [s, e] = timesOf(l);
  const when =
    l.start_date === l.end_date
      ? `${l.start_date}, ${t12(s)} to ${t12(e)}`
      : `${l.start_date} ${t12(s)} to ${l.end_date} ${t12(e)}`;

  await logMail(
    l.company_id, l.employee_email, "decision",
    `Your leave request was ${status}`,
`Hi ${l.employee_name.split(" ")[0]},

${by.name} has ${status} your ${l.leave_type} leave request (${when}, ${Number(l.days)} working day${Number(l.days) > 1 ? "s" : ""}).
${note?.trim() ? `\nComment: ${note.trim()}\n` : ""}
You can see the details under My history in Leave Nest.

- Leave Nest Team`
  );

  await notify({
    companyId: l.company_id,
    userId: l.user_id,
    type: status,
    title: `Leave request ${status}`,
    message: `${by.name} ${status} your ${l.leave_type} leave (${when}).${note?.trim() ? ` "${note.trim()}"` : ""}`.slice(0, 255),
    link: "/history",
  });

  res.json({ ok: true });
});

export default router;