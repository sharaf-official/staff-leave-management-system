import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const clean = (s, max = 150) => String(s || "").trim().slice(0, max);
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const map = (r) => ({
  id: r.id,
  name: r.name,
  registrationNo: r.registration_no || "",
  industry: r.industry || "",
  size: r.size || "",
  phone: r.phone || "",
  email: r.email || "",
  address: r.address || "",
  city: r.city || "",
  country: r.country || "",
  isDemo: !!r.is_demo,
});

// everyone in the company can read it
router.get("/", async (req, res) => {
  const [[c]] = await pool.query("SELECT * FROM companies WHERE id = ?", [req.auth.companyId]);
  if (!c) return res.status(404).json({ message: "Company not found." });
  res.json({ company: map(c) });
});

// only the admin can change it
router.put("/", requireRole("admin"), async (req, res) => {
  const b = req.body || {};
  const name = clean(b.name);
  const phone = clean(b.phone, 30);
  const email = clean(b.email).toLowerCase();
  const city = clean(b.city, 80);

  if (!name) return res.status(400).json({ message: "Enter the company name." });
  if (!phone) return res.status(400).json({ message: "Enter a contact phone number." });
  if (!emailOk(email)) return res.status(400).json({ message: "Enter a valid company email." });
  if (!city) return res.status(400).json({ message: "Enter the city." });

  const [[cur]] = await pool.query("SELECT is_demo FROM companies WHERE id = ?", [req.auth.companyId]);
  if (cur?.is_demo) return res.status(403).json({ message: "The demo company cannot be edited." });

  const [dup] = await pool.query("SELECT id FROM companies WHERE name = ? AND id <> ?", [name, req.auth.companyId]);
  if (dup.length) return res.status(409).json({ message: "Another company already uses this name." });

  await pool.query(
    `UPDATE companies SET name=?, registration_no=?, industry=?, size=?, phone=?, email=?, address=?, city=?, country=?     WHERE id=?`,
    [name, clean(b.registrationNo, 60), clean(b.industry, 60), clean(b.size, 20), phone, email,
     clean(b.address, 255), city, clean(b.country, 80) || "Sri Lanka", req.auth.companyId]
  );
  const [[c]] = await pool.query("SELECT * FROM companies WHERE id = ?", [req.auth.companyId]);
  res.json({ company: map(c) });
});

export default router;