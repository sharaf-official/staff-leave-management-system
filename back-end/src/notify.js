import { pool } from "./db.js";

// saves one in-app notification (never throws, so it can't break the main request)
export async function notify({ companyId, userId, type, title, message, link = null }) {
  try {
    await pool.query(
      "INSERT INTO notifications (company_id, user_id, type, title, message, link) VALUES (?,?,?,?,?,?)",
      [companyId, userId, type, title, message, link]
    );
  } catch (err) {
    console.error("notify failed:", err.message);
  }
}