export const DEMO_PASSWORD = "Slms@2026!";
export const DEMO_ACCOUNTS = [
  { role: "employee", email: "employee@company.com", password: DEMO_PASSWORD },
  { role: "manager", email: "manager@company.com", password: DEMO_PASSWORD },
  { role: "admin", email: "admin@company.com", password: DEMO_PASSWORD },
];

const pick = (chars, n) => {
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  return Array.from(buf, (x) => chars[x % chars.length]).join("");
};

// e.g. Nest-k7mq-XA42 (always has letters and digits)
export function generateTempPassword() {
  return `Nest-${pick("abcdefghjkmnpqrstuvwxyz23456789", 4)}-${pick("ABCDEFGHJKLMNPQRSTUVWXYZ", 2)}${pick("23456789", 2)}`;
}