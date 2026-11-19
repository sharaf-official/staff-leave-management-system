import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// latest notifications of the signed-in user
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, type, title, message, link, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30`,
    [req.auth.id]
  );
  const [[c]] = await pool.query(
    "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0",
    [req.auth.id]
  );
  res.json({
    unread: Number(c.n),
    notifications: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      link: r.link,
      read: !!r.is_read,
      createdAt: r.created_at,
    })),
  });
});

router.post("/read-all", async (req, res) => {
  await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.auth.id]);
  res.json({ ok: true });
});

router.patch("/:id/read", async (req, res) => {
  await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.auth.id]);
  res.json({ ok: true });
});

export default router;