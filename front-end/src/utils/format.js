export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n) => String(n).padStart(2, "0");

export const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export const localToday = () => {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
};

export const prettyDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const rangeText = (from, to) =>
  from === to ? prettyDate(from) : `${prettyDate(from)} - ${prettyDate(to)}`;

export const initials = (name) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export const longDate = () =>
  new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });