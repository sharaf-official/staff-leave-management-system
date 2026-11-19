import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../notify.js";

const router = Router();
router.use(requireAuth);

// everyone in the company can read
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.id, a.title, a.message, a.created_at, u.name AS author, u.role AS authorRole
     FROM announcements a
     JOIN users u ON u.id = a.author_id
     WHERE a.company_id = ?
     ORDER BY a.id DESC`,
    [req.auth.companyId]
  );
  res.json({ announcements: rows });
});

// only admin and manager can post
router.post("/", requireRole("admin", "manager"), async (req, res) => {
  const title = String(req.body.title || "").trim();
  const message = String(req.body.message || "").trim();
  if (title.length < 3 || title.length > 150)
    return res.status(400).json({ message: "Title must be 3 to 150 characters." });
  if (message.length < 5 || message.length > 2000)
    return res.status(400).json({ message: "Message must be 5 to 2000 characters." });

  const [r] = await pool.query(
    "INSERT INTO announcements (company_id, author_id, title, message) VALUES (?,?,?,?)",
    [req.auth.companyId, req.auth.id, title, message]
  );

  // notify everyone in the company except the author
  const [people] = await pool.query(
    "SELECT id FROM users WHERE company_id = ? AND status <> 'disabled' AND id <> ?",
    [req.auth.companyId, req.auth.id]
  );
  for (const p of people) {
    await notify({
      companyId: req.auth.companyId,
      userId: p.id,
      type: "announcement",
      title: "New announcement",
      message: title.slice(0, 255),
      link: "/announcements",
    });
  }

  res.status(201).json({ id: r.insertId });
});

export default router;