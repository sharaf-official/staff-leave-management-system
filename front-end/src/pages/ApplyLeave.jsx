import { useState } from "react";
import { Link } from "react-router-dom";
import { FiSend, FiCheckCircle, FiMail, FiInfo } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getDb, sendMail } from "../data/db";
import { leaveBalances, leaveRequests, leaveTypeList, teamRequests } from "../data/mockData";
import { DxHead, DxCard } from "../components/Dx";
import { localToday, plural } from "../utils/format";

const longDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// working days between two ISO dates (Mon - Fri), both included
const workingDays = (from, to) => {
  let count = 0;
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

const blank = { type: "", from: "", to: "", reason: "" };

export default function ApplyLeave() {
  const { user } = useAuth();
  const today = localToday();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const types = leaveTypeList.map((t) => ({
    name: t.name,
    total: t.days,
    remaining: leaveBalances.find((b) => b.type === t.name)?.remaining ?? t.days,
  }));
  const selected = types.find((t) => t.name === form.type);

  const days = form.from && form.to && form.to >= form.from ? workingDays(form.from, form.to) : 0;

  // who gets the email: the assigned manager, otherwise a company admin
  const users = getDb().users;
  const approver =
    users.find((u) => u.id === user.managerId) ||
    users.find((u) => u.companyId === user.companyId && u.role === "admin" && u.id !== user.id) ||
    null;

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.type) e.type = "Choose a leave type.";
    if (!form.from) e.from = "Choose a start date.";
    else if (form.from < today) e.from = "Start date cannot be in the past.";
    if (!form.to) e.to = "Choose an end date.";
    else if (form.from && form.to < form.from) e.to = "End date cannot be before the start date.";

    if (!e.from && !e.to && form.from && form.to) {
      if (days === 0) e.to = "These dates are weekends only. Choose working days.";
      else if (selected && days > selected.remaining)
        e.type = `You only have ${plural(selected.remaining, "day")} of ${selected.name.toLowerCase()} leave left.`;
      const clash = leaveRequests.find(
        (r) => (r.status === "Pending" || r.status === "Approved") && form.from <= r.to && form.to >= r.from
      );
      if (clash) e.from = `You already have a ${clash.status.toLowerCase()} request on these dates.`;
    }
    if (form.reason.trim().length < 10) e.reason = "Please give a short reason (at least 10 characters).";
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (sending) return;
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);

    setSending(true);
    setTimeout(() => {
      const id = Date.now();
      leaveRequests.unshift({ id, type: form.type, from: form.from, to: form.to, days, status: "Pending", reason: form.reason.trim() });
      if (approver && approver.role === "manager") {
        teamRequests.unshift({
          id: id + 1, employee: user.name, type: form.type, from: form.from, to: form.to, days,
          reason: form.reason.trim(), status: "Pending", comment: "",
        });
      }
      if (approver) {
        sendMail({
          type: "leave_request",
          companyId: user.companyId,
          to: approver.email,
          subject: `Leave request: ${user.name} - ${form.type} leave`,
          body:
`Hi ${approver.name.split(" ")[0]},

${user.name}${user.department ? ` (${user.department})` : ""} has requested leave and is waiting for your decision.

Leave type: ${form.type}
Dates: ${longDate(form.from)}${form.from !== form.to ? ` to ${longDate(form.to)}` : ""}
Working days: ${days}
Reason: ${form.reason.trim()}

Review and decide: ${window.location.origin}/approvals

- Leave Nest`,
        });
      }
      setResult({ type: form.type, from: form.from, to: form.to, days, approver });
      setForm(blank);
      setSending(false);
    }, 700);
  };

  /* ---------- success ---------- */
  if (result) {
    return (
      <div className="dx">
        <DxHead eyebrow="Leave request" title="Request submitted" />
        <DxCard className="ap-done">
          <span className="ap-done-icon"><FiCheckCircle /></span>
          <h2>Your request is with {result.approver ? result.approver.name : "your approver"}</h2>
          <p className="dx-muted">
            {result.type} leave, {result.from === result.to ? longDate(result.from) : `${longDate(result.from)} to ${longDate(result.to)}`}
            {" "}({plural(result.days, "working day")}). Status: <b>Pending</b>.
          </p>
          {result.approver && (
            <p className="dx-note ap-mailnote">
              <FiMail /> An email was sent to <b>{result.approver.email}</b>. You will be emailed when it is decided.
            </p>
          )}
          <div className="dx-actions">
            <Link to="/history" className="dx-btn primary">View my history</Link>
            <Link to="/outbox" className="dx-btn"><FiMail /> See the email</Link>
            <button type="button" className="dx-btn" onClick={() => setResult(null)}>Apply for another</button>
          </div>
        </DxCard>
      </div>
    );
  }

  /* ---------- form ---------- */
  const after = selected && days > 0 ? selected.remaining - days : null;

  return (
    <div className="dx">
      <DxHead
        eyebrow="Leave request"
        title="Apply for leave"
        subtitle="Choose the type and dates. Your approver is notified by email."
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
                       onChange={(e) => { set("from", e.target.value); if (form.to && e.target.value > form.to) set("to", ""); }} />
                {errors.from && <p className="ap-err">{errors.from}</p>}
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-to">End date</label>
                <input id="ap-to" type="date" min={form.from || today} value={form.to}
                       onChange={(e) => set("to", e.target.value)} />
                {errors.to && <p className="ap-err">{errors.to}</p>}
              </div>
            </div>

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
                <dt>Dates</dt>
                <dd>{form.from && form.to && form.to >= form.from
                  ? form.from === form.to ? longDate(form.from) : `${longDate(form.from)} to ${longDate(form.to)}`
                  : "-"}</dd>
              </div>
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