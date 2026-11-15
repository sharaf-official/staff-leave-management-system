import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const DEFAULTS = [["Annual", 14], ["Sick", 7], ["Casual", 5]];

async function list(companyId) {
  const q = () => pool.query("SELECT id, name, days FROM leave_types WHERE company_id = ? ORDER BY id", [companyId]);
  let [rows] = await q();
  if (!rows.length) {
    for (const [n, d] of DEFAULTS)
      await pool.query("INSERT IGNORE INTO leave_types (company_id, name, days) VALUES (?,?,?)", [companyId, n, d]);
    [rows] = await q();
  }
  return rows;
}

const check = (body) => {
  const name = String(body.name || "").trim();
  const days = Number(body.days);
  if (name.length < 2 || name.length > 50) return { error: "Name must be 2 to 50 characters." };
  if (!Number.isInteger(days) || days < 1 || days > 365) return { error: "Enter whole days between 1 and 365." };
  return { name, days };
};

router.get("/", async (req, res) => {
  res.json({ leaveTypes: await list(req.auth.companyId) });
});

router.post("/", requireRole("admin"), async (req, res) => {
  const v = check(req.body);
  if (v.error) return res.status(400).json({ message: v.error });
  try {
    await pool.query("INSERT INTO leave_types (company_id, name, days) VALUES (?,?,?)", [req.auth.companyId, v.name, v.days]);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "This leave type already exists." });
    throw e;
  }
});

router.put("/:id", requireRole("admin"), async (req, res) => {
  const v = check(req.body);
  if (v.error) return res.status(400).json({ message: v.error });
  const [[old]] = await pool.query("SELECT * FROM leave_types WHERE id = ? AND company_id = ?", [req.params.id, req.auth.companyId]);
  if (!old) return res.status(404).json({ message: "Leave type not found." });
  try {
    await pool.query("UPDATE leave_types SET name = ?, days = ? WHERE id = ?", [v.name, v.days, old.id]);
    if (old.name !== v.name)
      await pool.query("UPDATE leave_requests SET leave_type = ? WHERE company_id = ? AND leave_type = ?", [v.name, req.auth.companyId, old.name]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "This leave type already exists." });
    throw e;
  }
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const [[old]] = await pool.query("SELECT * FROM leave_types WHERE id = ? AND company_id = ?", [req.params.id, req.auth.companyId]);
  if (!old) return res.status(404).json({ message: "Leave type not found." });
  const [[c]] = await pool.query("SELECT COUNT(*) AS n FROM leave_requests WHERE company_id = ? AND leave_type = ?", [req.auth.companyId, old.name]);
  if (c.n > 0) return res.status(400).json({ message: "This leave type is used by existing requests, so it cannot be deleted." });
  await pool.query("DELETE FROM leave_types WHERE id = ?", [old.id]);
  res.json({ ok: true });
});

export default router;