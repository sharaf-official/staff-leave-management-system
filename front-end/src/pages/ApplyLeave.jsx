import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSend, FiCheckCircle, FiMail, FiInfo } from "react-icons/fi";
import { api } from "../api";
import { usedDays } from "../utils/leaves";
import { DxHead, DxCard } from "../components/Dx";
import { localToday, plural } from "../utils/format";
import { t12, leaveDays, hoursText, toMinutes } from "../utils/time";

const longDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const hasWeekday = (from, to) => {
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) return true;
    d.setDate(d.getDate() + 1);
  }
  return false;
};

const presets = [
  { label: "Full day", start: "09:00", end: "17:00" },
  { label: "Morning", start: "09:00", end: "13:00" },
  { label: "Afternoon", start: "13:00", end: "17:00" },
];
const blank = { type: "", from: "", to: "", startTime: "09:00", endTime: "17:00", reason: "" };

// office hours 9:00 AM - 5:00 PM, every 30 minutes (looks the same on every computer)
const timeSlots = Array.from({ length: 17 }, (_, i) => {
  const m = 540 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

export default function ApplyLeave() {
  const today = localToday();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [mine, setMine] = useState([]);
  const [approver, setApprover] = useState(null);
  const [typeList, setTypeList] = useState([]);

  const loadMine = () =>
    api("/leaves/mine").then(({ leaves }) => setMine(leaves)).catch(() => {});

  useEffect(() => {
    loadMine();
    api("/leaves/approver").then(({ approver: a }) => setApprover(a)).catch(() => {});
    api("/leave-types").then(({ leaveTypes }) => setTypeList(leaveTypes)).catch(() => {});
  }, []);

  const types = typeList.map((t) => ({
    name: t.name,
    total: t.days,
    remaining: Math.max(t.days - usedDays(mine, t.name), 0),
  }));
  const selected = types.find((t) => t.name === form.type);

  const datesOk = form.from !== "" && form.to !== "" && form.to >= form.from;
  const oneDay = datesOk && form.from === form.to;
  const days = datesOk ? leaveDays(form.from, form.to, form.startTime, form.endTime) : 0;

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "", time: name.endsWith("Time") ? "" : e.time }));
  };

  const onStartDate = (value) => {
    setForm((f) => ({ ...f, from: value, to: !f.to || value > f.to ? value : f.to }));
    setErrors((e) => ({ ...e, from: "", to: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.type) e.type = "Choose a leave type.";
    if (!form.from) e.from = "Choose a start date.";
    else if (form.from < today) e.from = "Start date cannot be in the past.";
    if (!form.to) e.to = "Choose an end date.";
    else if (form.from && form.to < form.from) e.to = "End date cannot be before the start date.";

    if (!e.from && !e.to && form.from && form.to) {
      if (!hasWeekday(form.from, form.to)) e.to = "These dates are weekends only. Choose working days.";
      else if (oneDay && toMinutes(form.endTime) - toMinutes(form.startTime) < 60)
        e.time = "The end time must be at least 1 hour after the start time.";
      else if (days === 0) e.time = "There is no working time between these dates and times.";
      else if (selected && days > selected.remaining)
        e.type = `You only have ${plural(selected.remaining, "day")} of ${selected.name.toLowerCase()} leave left.`;

      // clash = the two date+time ranges overlap
      const a0 = `${form.from} ${form.startTime}`;
      const a1 = `${form.to} ${form.endTime}`;
      const clash = mine.find(
        (r) =>
          (r.status === "Pending" || r.status === "Approved") &&
          a0 < `${r.to} ${r.endTime}` && `${r.from} ${r.startTime}` < a1
      );
      if (clash) e.from = `You already have a ${clash.status.toLowerCase()} request that overlaps this.`;
    }
    if (form.reason.trim().length < 10) e.reason = "Please give a short reason (at least 10 characters).";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (sending) return;
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);

    setSending(true);
    try {
      await api("/leaves", {
        method: "POST",
        body: {
          leaveType: form.type,
          startDate: form.from,
          endDate: form.to,
          startTime: form.startTime,
          endTime: form.endTime,
          reason: form.reason.trim(),
        },
      });
      setResult({
        type: form.type, from: form.from, to: form.to, days,
        startTime: form.startTime, endTime: form.endTime, approver,
      });
      setForm(blank);
      loadMine();
    } catch (err) {
      setErrors({ reason: err.message });
    } finally {
      setSending(false);
    }
  };

  /* ---------- success ---------- */
  if (result) {
    const single = result.from === result.to;
    return (
      <div className="dx">
        <DxHead eyebrow="Leave request" title="Request submitted" />
        <DxCard className="ap-done">
          <span className="ap-done-icon"><FiCheckCircle /></span>
          <h2>Your request is with {result.approver ? result.approver.name : "your approver"}</h2>
          <p className="dx-muted">
            {result.type} leave,{" "}
            {single
              ? `${longDate(result.from)}, ${t12(result.startTime)} to ${t12(result.endTime)}`
              : `${longDate(result.from)} ${t12(result.startTime)} to ${longDate(result.to)} ${t12(result.endTime)}`}
            {" "}({plural(result.days, "working day")}). Status: <b>Pending</b>.
          </p>
          {result.approver && (
            <p className="dx-note ap-mailnote">
              <FiMail /> {result.approver.name} was notified in the app and by email ({result.approver.email}). You will be notified when it is decided.
            </p>
          )}
          <div className="dx-actions">
            <Link to="/history" className="dx-btn primary">View my history</Link>
            <button type="button" className="dx-btn" onClick={() => setResult(null)}>Apply for another</button>
          </div>
        </DxCard>
      </div>
    );
  }

  /* ---------- form ---------- */
  const after = selected && days > 0 ? selected.remaining - days : null;

  const timeSelect = (id, label, name) => (
    <div className="ap-field">
      <label className="ap-label" htmlFor={id}>{label}</label>
      <select id={id} value={form[name]} onChange={(e) => set(name, e.target.value)}>
        {timeSlots.map((t) => <option key={t} value={t}>{t12(t)}</option>)}
      </select>
    </div>
  );

  return (
    <div className="dx">
      <DxHead
        eyebrow="Leave request"
        title="Apply for leave"
        subtitle="Choose the type, dates and times. Your approver is notified."
      />

      <div className="dx-grid">
        <DxCard>
          <form onSubmit={submit} noValidate className="ap-form">
            <div className="ap-field">
              <span className="ap-label" id="ap-type-label">Leave type</span>
              <div className="ap-types" role="radiogroup" aria-labelledby="ap-type-label">
                {types.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    role="radio"
                    aria-checked={form.type === t.name}
                    disabled={t.remaining === 0}
                    className={`ap-type ${form.type === t.name ? "on" : ""}`}
                    onClick={() => set("type", t.name)}
                  >
                    <b>{t.name}</b>
                    <small>{t.remaining} of {t.total} days left</small>
                  </button>
                ))}
              </div>
              {errors.type && <p className="ap-err">{errors.type}</p>}
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-from">Start date</label>
                <input id="ap-from" type="date" min={today} value={form.from}
                       onChange={(e) => onStartDate(e.target.value)} />
                {errors.from && <p className="ap-err">{errors.from}</p>}
              </div>
              {timeSelect("ap-st", "Start time", "startTime")}
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-to">End date</label>
                <input id="ap-to" type="date" min={form.from || today} value={form.to}
                       onChange={(e) => set("to", e.target.value)} />
                {errors.to && <p className="ap-err">{errors.to}</p>}
              </div>
              {timeSelect("ap-et", "End time", "endTime")}
            </div>

            {errors.time && <p className="ap-err">{errors.time}</p>}

            {oneDay && (
              <div className="ap-field">
                <span className="ap-label" id="ap-quick-label">Quick pick</span>
                <div className="ap-types" role="radiogroup" aria-labelledby="ap-quick-label">
                  {presets.map((p) => {
                    const on = form.startTime === p.start && form.endTime === p.end;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        className={`ap-type ${on ? "on" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, startTime: p.start, endTime: p.end }))}
                      >
                        <b>{p.label}</b>
                        <small>{t12(p.start)} - {t12(p.end)}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <small className="dx-muted">
              Office hours are 9:00 AM - 5:00 PM. On each working day, up to 4 hours counts as a half day (0.5) and more than 4 hours as a full day.
            </small>

            <div className="ap-field">
              <label className="ap-label" htmlFor="ap-reason">Reason</label>
              <textarea id="ap-reason" rows="4" maxLength={300} value={form.reason}
                        placeholder="Briefly tell your approver why you need this leave"
                        onChange={(e) => set("reason", e.target.value)} />
              <div className="ap-meta">
                {errors.reason ? <p className="ap-err">{errors.reason}</p> : <span />}
                <small>{form.reason.length}/300</small>
              </div>
            </div>

            <div className="dx-actions">
              <button type="submit" className="dx-btn primary" disabled={sending}>
                <FiSend /> {sending ? "Sending..." : "Submit request"}
              </button>
              <button type="button" className="dx-btn" onClick={() => { setForm(blank); setErrors({}); }} disabled={sending}>
                Clear
              </button>
            </div>
          </form>
        </DxCard>

        <div className="dx-stack">
          <DxCard title="Request summary">
            <dl className="ap-sum">
              <div><dt>Leave type</dt><dd>{form.type ? `${form.type} leave` : "-"}</dd></div>
              <div>
                <dt>From</dt>
                <dd>{form.from ? `${longDate(form.from)}, ${t12(form.startTime)}` : "-"}</dd>
              </div>
              <div>
                <dt>To</dt>
                <dd>{form.to && form.to >= form.from ? `${longDate(form.to)}, ${t12(form.endTime)}` : "-"}</dd>
              </div>
              {oneDay && days > 0 && (
                <div><dt>Hours</dt><dd>{hoursText(form.startTime, form.endTime)}</dd></div>
              )}
              <div><dt>Working days</dt><dd>{days > 0 ? days : "-"}</dd></div>
              <div>
                <dt>Balance after</dt>
                <dd className={after !== null && after < 0 ? "ap-bad" : ""}>
                  {after !== null ? `${after} of ${selected.total} days` : "-"}
                </dd>
              </div>
              <div>
                <dt>Approver</dt>
                <dd>{approver ? approver.name : "Not assigned"}</dd>
              </div>
            </dl>
            <p className="dx-note ap-info"><FiInfo /> Saturdays and Sundays are not counted.</p>
          </DxCard>
        </div>
      </div>
    </div>
  );
}