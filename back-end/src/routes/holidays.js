import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

// everyone in the company can read
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, DATE_FORMAT(holiday_date, '%Y-%m-%d') AS date FROM holidays WHERE company_id = ? ORDER BY holiday_date",
    [req.auth.companyId]
  );
  res.json({ holidays: rows });
});

// admin adds a holiday
router.post("/", requireRole("admin"), async (req, res) => {
  const name = String(req.body.name || "").trim();
  const date = String(req.body.date || "");
  if (name.length < 2 || name.length > 100)
    return res.status(400).json({ message: "Name must be 2 to 100 characters." });
  if (!isDate(date)) return res.status(400).json({ message: "Choose a valid date." });

  try {
    await pool.query("INSERT INTO holidays (company_id, name, holiday_date) VALUES (?,?,?)", [
      req.auth.companyId,
      name,
      date,
    ]);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "A holiday already exists on this date." });
    throw e;
  }
});

// admin deletes a holiday
router.delete("/:id", requireRole("admin"), async (req, res) => {
  const [r] = await pool.query("DELETE FROM holidays WHERE id = ? AND company_id = ?", [
    req.params.id,
    req.auth.companyId,
  ]);
  if (!r.affectedRows) return res.status(404).json({ message: "Holiday not found." });
  res.json({ ok: true });
});

export default router;