import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// list (also picks up departments typed in when adding employees)
router.get("/", async (req, res) => {
  await pool.query(
    `INSERT IGNORE INTO departments (company_id, name)
     SELECT DISTINCT company_id, department FROM users
     WHERE company_id = ? AND department IS NOT NULL AND department <> ''`,
    [req.auth.companyId]
  );
  const [rows] = await pool.query(
    `SELECT d.id, d.name,
       (SELECT COUNT(*) FROM users u WHERE u.company_id = d.company_id AND u.department = d.name) AS staff
     FROM departments d WHERE d.company_id = ? ORDER BY d.name`,
    [req.auth.companyId]
  );
  res.json({ departments: rows });
});

router.post("/", requireRole("admin"), async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (name.length < 2) return res.status(400).json({ message: "Department name must be at least 2 characters." });
  const [dup] = await pool.query("SELECT id FROM departments WHERE company_id = ? AND name = ?", [req.auth.companyId, name]);
  if (dup.length) return res.status(409).json({ message: "This department already exists." });
  await pool.query("INSERT INTO departments (company_id, name) VALUES (?, ?)", [req.auth.companyId, name]);
  res.status(201).json({ ok: true });
});

router.put("/:id", requireRole("admin"), async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (name.length < 2) return res.status(400).json({ message: "Department name must be at least 2 characters." });
  const [[d]] = await pool.query("SELECT * FROM departments WHERE id = ? AND company_id = ?", [req.params.id, req.auth.companyId]);
  if (!d) return res.status(404).json({ message: "Department not found." });
  const [dup] = await pool.query("SELECT id FROM departments WHERE company_id = ? AND name = ? AND id <> ?", [req.auth.companyId, name, d.id]);
  if (dup.length) return res.status(409).json({ message: "This department already exists." });
  await pool.query("UPDATE departments SET name = ? WHERE id = ?", [name, d.id]);
  await pool.query("UPDATE users SET department = ? WHERE company_id = ? AND department = ?", [name, req.auth.companyId, d.name]);
  res.json({ ok: true });
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const [[d]] = await pool.query("SELECT * FROM departments WHERE id = ? AND company_id = ?", [req.params.id, req.auth.companyId]);
  if (!d) return res.status(404).json({ message: "Department not found." });
  const [[c]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE company_id = ? AND department = ?", [req.auth.companyId, d.name]);
  if (c.n > 0) return res.status(400).json({ message: "A department that still has staff cannot be deleted." });
  await pool.query("DELETE FROM departments WHERE id = ?", [d.id]);
  res.json({ ok: true });
});

export default router;