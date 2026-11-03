import { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { users } from "../data/mockData";

const emptyForm = { current: "", next: "", confirm: "" };

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const strengthInfo = [
  { label: "Too weak", color: "#dc2626" },
  { label: "Weak", color: "#ea580c" },
  { label: "Fair", color: "#d97706" },
  { label: "Good", color: "#65a30d" },
  { label: "Strong", color: "#16a34a" },
];

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [success, setSuccess] = useState("");

  const strength = getStrength(form.next);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setSuccess("");
  };

  const toggle = (field) => setShow({ ...show, [field]: !show[field] });

  const validate = () => {
    const e = {};
    const account = users.find((u) => u.email === user.email);

    if (!form.current) e.current = "Enter your current password.";
    else if (!account || account.password !== form.current) e.current = "Current password is incorrect.";

    if (form.next.length < 8) e.next = "New password must be at least 8 characters.";
    else if (!/[A-Za-z]/.test(form.next) || !/\d/.test(form.next))
      e.next = "Use at least one letter and one number.";
    else if (form.next === form.current) e.next = "New password must be different from the current one.";

    if (!form.confirm) e.confirm = "Confirm your new password.";
    else if (form.confirm !== form.next) e.confirm = "Passwords do not match.";

    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    // Mock only: update in-memory user. The real system will call the API (bcrypt hash).
    const account = users.find((u) => u.email === user.email);
    account.password = form.next;
    setForm(emptyForm);
    setSuccess("Password changed successfully.");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const field = (name, label) => (
    <div className="us-field">
      <label htmlFor={name}>{label}</label>
      <div className="pf-input">
        <input
          id={name}
          name={name}
          type={show[name] ? "text" : "password"}
          value={form[name]}
          onChange={handleChange}
          autoComplete="off"
        />
        <button type="button" className="pf-eye" onClick={() => toggle(name)} aria-label="Show or hide password">
          {show[name] ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {errors[name] && <p className="rv-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="pf-grid">
      <div className="card pf-profile">
        <div className="pf-avatar">{initials}</div>
        <h3>{user.name}</h3>
        <span className={`role-badge role-${user.role}`}>{user.role}</span>
        <div className="pf-details">
          <div><span>Email</span><b>{user.email}</b></div>
          <div><span>Department</span><b>{user.department || "-"}</b></div>
          <div><span>Role</span><b style={{ textTransform: "capitalize" }}>{user.role}</b></div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title"><FiLock style={{ verticalAlign: "-2px" }} /> Change password</h3>
        {success && <div className="rv-toast">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {field("current", "Current password")}
          {field("next", "New password")}

          {form.next && (
            <div className="pf-strength">
              <div className="pf-bars">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    style={{ background: n <= strength ? strengthInfo[strength].color : "#e2e8f0" }}
                  />
                ))}
              </div>
              <small style={{ color: strengthInfo[strength].color }}>{strengthInfo[strength].label}</small>
            </div>
          )}

          {field("confirm", "Confirm new password")}

          <ul className="pf-rules">
            <li>At least 8 characters</li>
            <li>At least one letter and one number</li>
            <li>Different from your current password</li>
          </ul>

          <button type="submit" className="btn">Update password</button>
        </form>
      </div>
    </div>
  );
}