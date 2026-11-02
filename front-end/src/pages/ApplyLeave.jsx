import { useState } from "react";
import { leaveBalances } from "../data/mockData";

const today = new Date().toISOString().split("T")[0];

function countWorkingDays(start, end) {
  let count = 0;
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

const emptyForm = { type: "", start: "", end: "", reason: "" };

export default function ApplyLeave() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const balance = leaveBalances.find((b) => b.type === form.type);
  const datesOk = form.start && form.end && form.end >= form.start;
  const totalDays = datesOk ? countWorkingDays(form.start, form.end) : 0;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess("");
  };

  const validate = () => {
    const e = {};
    if (!form.type) e.type = "Please select a leave type";
    if (!form.start) e.start = "Start date is required";
    else if (form.start < today) e.start = "Start date cannot be in the past";
    if (!form.end) e.end = "End date is required";
    else if (form.start && form.end < form.start) e.end = "End date cannot be before start date";
    if (form.reason.trim().length < 5) e.reason = "Reason must be at least 5 characters";

    if (!e.type && !e.start && !e.end) {
      if (totalDays === 0) e.end = "Selected dates have no working days (weekends excluded)";
      else if (balance && totalDays > balance.remaining)
        e.type = `Not enough balance. You have ${balance.remaining} days left`;
    }
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setSuccess(`Leave request submitted for ${totalDays} working day(s). Status: Pending`);
    setForm(emptyForm);
  };

  return (
    <div>
      <h1 className="page-title">Apply for Leave</h1>
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-group">
          <label>Leave type</label>
          <select name="type" value={form.type} onChange={handleChange}
                  className={errors.type ? "invalid" : ""}>
            <option value="">Select leave type</option>
            {leaveBalances.map((b) => (
              <option key={b.type} value={b.type}>{b.type} ({b.remaining} days left)</option>
            ))}
          </select>
          {errors.type && <div className="error-text">{errors.type}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start date</label>
            <input type="date" name="start" min={today} value={form.start}
                   onChange={handleChange} className={errors.start ? "invalid" : ""} />
            {errors.start && <div className="error-text">{errors.start}</div>}
          </div>
          <div className="form-group">
            <label>End date</label>
            <input type="date" name="end" min={form.start || today} value={form.end}
                   onChange={handleChange} className={errors.end ? "invalid" : ""} />
            {errors.end && <div className="error-text">{errors.end}</div>}
          </div>
        </div>

        {datesOk && form.type && balance && (
          <div className="info-box">
            Total working days: <b>{totalDays}</b> · Balance after: <b>{balance.remaining - totalDays}</b>
          </div>
        )}

        <div className="form-group">
          <label>Reason</label>
          <textarea name="reason" rows="3" value={form.reason} onChange={handleChange}
                    className={errors.reason ? "invalid" : ""} placeholder="Enter reason..." />
          {errors.reason && <div className="error-text">{errors.reason}</div>}
        </div>

        <button className="btn" type="submit">Submit</button>
      </form>
    </div>
  );
}