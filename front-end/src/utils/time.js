export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

// "13:00" -> "1:00 PM"
export const t12 = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const OFFICE_START = 540; // 9:00 AM
const OFFICE_END = 1020; // 5:00 PM
// up to 4 hours = half day, more = 1 day
const dayPart = (mins) => (mins <= 0 ? 0 : mins <= 240 ? 0.5 : 1);

// leave from (date + time) to (date + time). Weekends are skipped.
export const leaveDays = (from, to, startTime, endTime, off = new Set()) => {
  if (!from || !to || to < from) return 0;
  const first = new Date(`${from}T00:00:00`).getTime();
  const last = new Date(`${to}T00:00:00`).getTime();
  let total = 0;
  for (const d = new Date(first); d.getTime() <= last; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd === 0 || wd === 6) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (off.has(iso)) continue;
    const t = d.getTime();
    const s = t === first ? toMinutes(startTime) : OFFICE_START;
    const e = t === last ? toMinutes(endTime) : OFFICE_END;
    total += dayPart(e - s);
  }
  return total;
};

export const hoursText = (start, end) => {
  const h = (toMinutes(end) - toMinutes(start)) / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
};

// text for tables
export const timeRange = (r) =>
  r.from === r.to
    ? `${t12(r.startTime)} - ${t12(r.endTime)}`
    : `Starts ${t12(r.startTime)}, ends ${t12(r.endTime)}`;