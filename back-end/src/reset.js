import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const [name, email, password, company] = process.argv.slice(2);
if (!name || !email || !password || !company) {
  console.log('Usage: node src/reset.js "Your Name" you@gmail.com "YourPassword1" "Company Name"');
  process.exit(1);
}

await pool.query("SET FOREIGN_KEY_CHECKS = 0");
for (const t of ["email_log", "leave_requests", "users", "companies"]) {
  await pool.query(`TRUNCATE TABLE ${t}`);
}
await pool.query("SET FOREIGN_KEY_CHECKS = 1");

const [c] = await pool.query(
  "INSERT INTO companies (name, is_demo) VALUES (?, 0)",
  [company]
);
const hash = await bcrypt.hash(password, 10);
await pool.query(
  `INSERT INTO users (company_id, name, email, password_hash, role, department, job_title, status, must_change_password)
   VALUES (?, ?, ?, ?, 'admin', 'Administration', 'Administrator', 'active', 0)`,
  [c.insertId, name, email.trim().toLowerCase(), hash]
);
console.log("Done. Only this admin exists now:", email);
process.exit(0);