const KEY = "leavenest-db-v1";

export const DEMO_PASSWORD = "Slms@2026!";
export const DEMO_ACCOUNTS = [
  { role: "employee", email: "employee@company.com", password: DEMO_PASSWORD },
  { role: "manager", email: "manager@company.com", password: DEMO_PASSWORD },
  { role: "admin", email: "admin@company.com", password: DEMO_PASSWORD },
];

/*
 * MOCK ONLY. This simple hash just keeps plain passwords out of localStorage.
 * The real system (E4) hashes passwords on the server with bcrypt.
 */
export function mockHash(password, salt) {
  const text = `${String(salt).toLowerCase()}::${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = (Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13)) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

const emptyProfile = { phone: "", address: "", emergencyName: "", emergencyPhone: "", dob: "", bio: "" };

const makeUser = (o) => ({
  id: o.id,
  companyId: o.companyId,
  name: o.name,
  email: o.email,
  passwordHash: mockHash(o.password, o.email),
  role: o.role,
  department: o.department,
  managerId: o.managerId ?? null,
  jobTitle: o.jobTitle || "",
  joinDate: o.joinDate || "2025-01-15",
  status: o.status || "active",
  mustChangePassword: Boolean(o.mustChange),
  tempExpiresAt: o.tempExpiresAt ?? null,
  lastLoginAt: null,
  profile: { ...emptyProfile },
});

const seed = () => ({
  version: 1,
  nextId: 100,
  companies: [
    {
      id: 1, name: "Leave Nest Demo Co.", isDemo: true, registrationNo: "DEMO-001", industry: "Technology",
      size: "11-50", address: "No. 12, Galle Road", city: "Colombo", country: "Sri Lanka",
      phone: "+94 11 234 5678", email: "info@demo-company.com", website: "https://www.sharafizam.com",
    },
    {
      id: 2, name: "Acme Test Pvt Ltd", isDemo: false, registrationNo: "PV-12345", industry: "Retail",
      size: "1-10", address: "45 Main Street", city: "Kandy", country: "Sri Lanka",
      phone: "+94 81 222 3344", email: "info@acme-test.com", website: "",
    },
  ],
  users: [
    makeUser({ id: 1, companyId: 1, name: "Amal Perera", email: "employee@company.com", password: DEMO_PASSWORD, role: "employee", department: "IT", managerId: 2, jobTitle: "Software Engineer" }),
    makeUser({ id: 2, companyId: 1, name: "Nimal Fernando", email: "manager@company.com", password: DEMO_PASSWORD, role: "manager", department: "IT", jobTitle: "Engineering Manager" }),
    makeUser({ id: 3, companyId: 1, name: "Sara Kumar", email: "admin@company.com", password: DEMO_PASSWORD, role: "admin", department: "HR", jobTitle: "HR Administrator" }),
    // test account for the first-login flow (company 2, not a demo company)
    makeUser({
      id: 4, companyId: 2, name: "Kasun Silva", email: "new.user@acme.com", password: "Nest-1234-Ab", role: "employee",
      department: "Sales", jobTitle: "Sales Executive", status: "invited", mustChange: true,
      tempExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  ],
  outbox: [],
});

function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage blocked */
  }
}

export function getDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore and reseed */
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

export function findUserByEmail(email) {
  const wanted = String(email).trim().toLowerCase();
  return getDb().users.find((u) => u.email.toLowerCase() === wanted) || null;
}

export function getCompany(id) {
  return getDb().companies.find((c) => c.id === id) || null;
}

export function updateUser(id, patch) {
  const db = getDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index < 0) return null;
  db.users[index] = { ...db.users[index], ...patch };
  save(db);
  return db.users[index];
}

export function verifyPassword(user, password) {
  return user.passwordHash === mockHash(password, user.email);
}

export function resetDb() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/* ===================== Step B: users admin + email outbox ===================== */

const pick = (chars, n) => {
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  return Array.from(buf, (x) => chars[x % chars.length]).join("");
};

// e.g. Nest-k7mq-XA42 (always has letters and digits)
export function generateTempPassword() {
  return `Nest-${pick("abcdefghjkmnpqrstuvwxyz23456789", 4)}-${pick("ABCDEFGHJKLMNPQRSTUVWXYZ", 2)}${pick("23456789", 2)}`;
}

export function getCompanyUsers(companyId) {
  return getDb().users.filter((u) => u.companyId === companyId);
}

export function sendMail(mail) {
  const db = getDb();
  db.outbox = db.outbox || [];
  db.outbox.unshift({
    id: `m${Date.now()}${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    ...mail,
  });
  db.outbox = db.outbox.slice(0, 200);
  save(db);
}

export function getOutbox(user) {
  const all = getDb().outbox || [];
  return all.filter(
    (m) => m.companyId === user.companyId && (user.role === "admin" || m.to.toLowerCase() === user.email.toLowerCase())
  );
}

export function clearOutbox(companyId) {
  const db = getDb();
  db.outbox = (db.outbox || []).filter((m) => m.companyId !== companyId);
  save(db);
}

function invitationMail(user, company, tempPassword, invitedBy) {
  const roleText = user.role === "admin" ? "an administrator" : user.role === "manager" ? "a manager" : "an employee";
  return {
    type: "invitation",
    companyId: company.id,
    to: user.email,
    subject: `You're invited to ${company.name} on Leave Nest`,
    body:
`Hi ${user.name.split(" ")[0]},

${invitedBy} has added you to ${company.name} as ${roleText} on Leave Nest.

Sign in here: ${window.location.origin}/login
Email: ${user.email}
Temporary password: ${tempPassword}

For your security you must change this password the first time you sign in.
The temporary password expires in 7 days.

If you were not expecting this email, please ignore it.

- Leave Nest Team`,
  };
}

export function addUser(data) {
  const db = getDb();
  const email = data.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, message: "This email is already registered." };
  }
  const user = makeUser({
    id: db.nextId++,
    companyId: data.companyId,
    name: data.name.trim(),
    email,
    password: data.tempPassword,
    role: data.role,
    department: data.department.trim(),
    managerId: data.managerId,
    jobTitle: data.jobTitle.trim(),
    joinDate: data.joinDate,
    status: "invited",
    mustChange: true,
    tempExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  user.profile.phone = data.phone.trim();
  db.users.push(user);
  save(db);
  const company = db.companies.find((c) => c.id === data.companyId);
  sendMail(invitationMail(user, company, data.tempPassword, data.invitedBy));
  return { ok: true, user };
}

export function editUser(id, data) {
  const db = getDb();
  const u = db.users.find((x) => x.id === id);
  if (!u) return { ok: false, message: "User not found." };
  u.name = data.name.trim();
  u.jobTitle = data.jobTitle.trim();
  u.department = data.department.trim();
  u.role = data.role;
  u.managerId = data.managerId;
  u.profile = { ...u.profile, phone: data.phone.trim() };
  save(db);
  return { ok: true, user: u };
}

export function setUserStatus(id, disabled) {
  const u = getDb().users.find((x) => x.id === id);
  if (!u) return null;
  return updateUser(id, { status: disabled ? "disabled" : u.mustChangePassword ? "invited" : "active" });
}

export function resendInvite(id, invitedBy) {
  const db = getDb();
  const u = db.users.find((x) => x.id === id);
  if (!u) return { ok: false, message: "User not found." };
  const temp = generateTempPassword();
  const updated = updateUser(id, {
    passwordHash: mockHash(temp, u.email),
    mustChangePassword: true,
    status: "invited",
    tempExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const company = db.companies.find((c) => c.id === u.companyId);
  sendMail(invitationMail(updated, company, temp, invitedBy));
  return { ok: true };
}


/* ===================== Register company ===================== */

export function getMailsTo(emails) {
  const wanted = emails.map((e) => e.toLowerCase());
  return (getDb().outbox || []).filter((m) => wanted.includes(m.to.toLowerCase())).reverse();
}

export function registerCompany({ company, admin, manager }) {
  const db = getDb();
  const adminEmail = admin.email.trim().toLowerCase();
  const managerEmail = manager.email.trim().toLowerCase();

  if (adminEmail === managerEmail) {
    return { ok: false, step: 2, message: "Admin and manager must use different email addresses." };
  }
  if (db.companies.some((c) => c.name.trim().toLowerCase() === company.name.trim().toLowerCase())) {
    return { ok: false, step: 0, message: "A company with this name is already registered." };
  }
  if (db.users.some((u) => u.email.toLowerCase() === adminEmail)) {
    return { ok: false, step: 1, message: "The admin email is already registered." };
  }
  if (db.users.some((u) => u.email.toLowerCase() === managerEmail)) {
    return { ok: false, step: 2, message: "The manager email is already registered." };
  }

  const companyId = db.nextId++;
  db.companies.push({
    id: companyId,
    name: company.name.trim(),
    isDemo: false,
    registrationNo: company.registrationNo.trim(),
    industry: company.industry,
    size: company.size,
    address: company.address.trim(),
    city: company.city.trim(),
    country: company.country.trim(),
    phone: company.phone.trim(),
    email: company.email.trim(),
    website: "",
  });

  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const adminTemp = generateTempPassword();
  const managerTemp = generateTempPassword();

  const adminUser = makeUser({
    id: db.nextId++, companyId, name: admin.name.trim(), email: adminEmail, password: adminTemp,
    role: "admin", department: "Administration", jobTitle: "Company Administrator",
    joinDate: new Date().toISOString().slice(0, 10), status: "invited", mustChange: true, tempExpiresAt: expires,
  });
  adminUser.profile.phone = admin.phone.trim();

  const managerUser = makeUser({
    id: db.nextId++, companyId, name: manager.name.trim(), email: managerEmail, password: managerTemp,
    role: "manager", department: manager.department.trim(), jobTitle: "Manager",
    joinDate: new Date().toISOString().slice(0, 10), status: "invited", mustChange: true, tempExpiresAt: expires,
  });

  db.users.push(adminUser, managerUser);
  save(db);

  const saved = db.companies.find((c) => c.id === companyId);
  sendMail(invitationMail(adminUser, saved, adminTemp, "Leave Nest"));
  sendMail(invitationMail(managerUser, saved, managerTemp, "Leave Nest"));

  return {
    ok: true,
    company: saved,
    recipients: [
      { name: adminUser.name, email: adminEmail, role: "Admin" },
      { name: managerUser.name, email: managerEmail, role: "Manager" },
    ],
  };
}