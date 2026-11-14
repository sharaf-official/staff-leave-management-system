import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const [c] = await pool.query(
  "INSERT INTO companies (name, industry, size, is_demo) VALUES ('Demo Co.', 'Technology', '1-50', 1)"
);
const hash = await bcrypt.hash("Slms@2026!", 10);
await pool.query(
  `INSERT INTO users (company_id, name, email, password_hash, role, department, job_title, status, must_change_password)
   VALUES (?, 'Demo Admin', 'admin@company.com', ?, 'admin', 'HR', 'Administrator', 'active', 0)`,
  [c.insertId, hash]
);
console.log("Seeded demo company + admin@company.com");
process.exit(0);