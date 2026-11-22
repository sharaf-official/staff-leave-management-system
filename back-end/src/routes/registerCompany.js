import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db.js";
import { deliver } from "../mailer.js";

const router = Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v, max) => String(v || "").trim().slice(0, max) || null;

const pick = (chars, n) => Array.from(crypto.randomBytes(n), (b) => chars[b % chars.length]).join("");
const makeTemp = () =>
  `Nest-${pick("abcdefghjkmnpqrstuvwxyz23456789", 4)}-${pick("ABCDEFGHJKLMNPQRSTUVWXYZ", 2)}${pick("23456789", 2)}`;

const mailFor = (name, role, companyName, email, temp, origin) => ({
  subject: `You're invited to ${companyName} on Leave Nest`,
  body: `Hi ${name.split(" ")[0]},

${companyName} has been registered on Leave Nest and you are the ${role}.

Sign in here: ${origin}/#/login
Email: ${email}
Temporary password: ${temp}

You must change this password the first time you sign in.
The temporary password expires in 7 days.

If you were not expecting this email, please ignore it.

- Leave Nest Team`,
});

router.post("/", async (req, res) => {
  const { company = {}, admin = {}, manager = {}, sendEmails = true } = req.body;
  const cName = String(company.name || "").trim();
  const aName = String(admin.name || "").trim();
  const mName = String(manager.name || "").trim();
  const aEmail = String(admin.email || "").trim().toLowerCase();
  const mEmail = String(manager.email || "").trim().toLowerCase();

  if (cName.length < 2) return res.status(400).json({ message: "Enter the company name." });
  if (!aName || !EMAIL.test(aEmail)) return res.status(400).json({ message: "Enter the admin's name and a valid email." });
  if (!mName || !EMAIL.test(mEmail)) return res.status(400).json({ message: "Enter the manager's name and a valid email." });
  if (aEmail === mEmail) return res.status(400).json({ message: "Admin and manager must use different email addresses." });

  const [dupCo] = await pool.query("SELECT id FROM companies WHERE LOWER(name) = ?", [cName.toLowerCase()]);
  if (dupCo.length) return res.status(409).json({ message: "A company with this name is already registered." });
  const [dupU] = await pool.query("SELECT email FROM users WHERE email IN (?, ?)", [aEmail, mEmail]);
  if (dupU.length) return res.status(409).json({ message: `${dupU[0].email} is already registered.` });

  const origin = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";
  const adminTemp = makeTemp();
  const managerTemp = makeTemp();
  const [adminHash, managerHash] = await Promise.all([bcrypt.hash(adminTemp, 10), bcrypt.hash(managerTemp, 10)]);
  const aMail = mailFor(aName, "administrator", cName, aEmail, adminTemp, origin);
  const mMail = mailFor(mName, "manager", cName, mEmail, managerTemp, origin);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [c] = await conn.query(
      `INSERT INTO companies (name, registration_no, industry, size, address, city, country, phone, email, is_demo)
       VALUES (?,?,?,?,?,?,?,?,?,0)`,
      [cName, clean(company.registrationNo, 60), clean(company.industry, 60), clean(company.size, 20),
       clean(company.address, 255), clean(company.city, 80), clean(company.country, 80) || "Sri Lanka",
       clean(company.phone, 30), clean(company.email, 150)]
    );
    const companyId = c.insertId;
    await conn.query(
      `INSERT INTO users (company_id,name,email,password_hash,role,department,job_title,phone,join_date,status,must_change_password,temp_expires_at)
       VALUES (?,?,?,?,'admin','Administration','Company Administrator',?,CURDATE(),'invited',1,DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [companyId, aName, aEmail, adminHash, clean(admin.phone, 30)]
    );
    await conn.query(
      `INSERT INTO users (company_id,name,email,password_hash,role,department,job_title,join_date,status,must_change_password,temp_expires_at)
       VALUES (?,?,?,?,'manager',?,'Manager',CURDATE(),'invited',1,DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [companyId, mName, mEmail, managerHash, clean(manager.department, 100) || "Management"]
    );
    for (const [to, m] of [[aEmail, aMail], [mEmail, mMail]]) {
      await conn.query(
        "INSERT INTO email_log (company_id, to_email, type, subject, body) VALUES (?,?,'invitation',?,?)",
        [companyId, to, m.subject, m.body]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: "Could not register the company. Please try again." });
  } finally {
    conn.release();
  }

  // optional real email (needs MAIL_ENABLED=true and SMTP settings)
  let adminSent = false;
  let managerSent = false;
  if (sendEmails) {
    const replyTo = clean(company.email, 150) || undefined;
    const [a, m] = await Promise.all([
      deliver({ fromName: cName, replyTo, to: aEmail, subject: aMail.subject, text: aMail.body }),
      deliver({ fromName: cName, replyTo, to: mEmail, subject: mMail.subject, text: mMail.body }),
    ]);
    adminSent = a.sent;
    managerSent = m.sent;
  }

  // anyone who was not really emailed: return the login details so they can be shared by hand
  const credentials = [];
  if (!adminSent) credentials.push({ role: "Admin", name: aName, email: aEmail, tempPassword: adminTemp });
  if (!managerSent) credentials.push({ role: "Manager", name: mName, email: mEmail, tempPassword: managerTemp });

  res.status(201).json({
    ok: true,
    recipients: [
      { role: "Admin", name: aName, email: aEmail, emailed: adminSent },
      { role: "Manager", name: mName, email: mEmail, emailed: managerSent },
    ],
    credentials,
  });
});

export default router;