import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const [[c]] = await pool.query("SELECT id FROM companies WHERE is_demo = 1 ORDER BY id LIMIT 1");
const hash = await bcrypt.hash("Slms@2026!", 10);

const [m] = await pool.query(
  `INSERT INTO users (company_id, name, email, password_hash, role, department, job_title, status, must_change_password)
   VALUES (?, 'Nimal Fernando', 'manager@company.com', ?, 'manager', 'IT', 'Engineering Manager', 'active', 0)`,
  [c.id, hash]
);
await pool.query(
  `INSERT INTO users (company_id, name, email, password_hash, role, department, job_title, manager_id, status, must_change_password)
   VALUES (?, 'Amal Perera', 'employee@company.com', ?, 'employee', 'IT', 'Software Engineer', ?, 'active', 0)`,
  [c.id, hash, m.insertId]
);
console.log("Demo manager + employee added");
process.exit(0);