import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FiShield, FiLock, FiCheckCircle, FiCircle, FiAlertCircle, FiLogOut, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

const strengthColors = ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80"];
const strengthLabels = ["Too weak", "Weak", "Fair", "Good", "Strong"];

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function FirstLogin() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword && !done) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const strength = getStrength(form.next);
  const checks = [
    { ok: form.next.length >= 8, text: "At least 8 characters" },
    { ok: /[A-Za-z]/.test(form.next) && /\d/.test(form.next), text: "At least one letter and one number" },
    { ok: form.next !== "" && form.next !== form.current, text: "Different from your temporary password" },
    { ok: form.confirm !== "" && form.confirm === form.next, text: "Both passwords match" },
  ];
  const canSubmit = form.current !== "" && checks.every((c) => c.ok);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please complete all the password requirements.");
      return;
    }
    const result = changePassword(form.current, form.next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/dashboard", { replace: true }), 1400);
  };

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="lg-page">
      <div className="lg-bg" aria-hidden="true">
        <span className="lg-shape lg-pill p1" />
        <span className="lg-shape lg-pill p2" />
        <span className="lg-shape lg-ring r1" />
        <span className="lg-shape lg-ring r2" />
        <span className="lg-shape lg-circle" />
        <span className="lg-shape lg-orb o1" />
        <span className="lg-shape lg-orb o2" />
      </div>

      <main className="lg-center solo">
        <form className="lg-card" onSubmit={handleSubmit} noValidate>
          {done ? (
            <div className="fl-done" role="status">
              <span className="fl-done-icon"><FiCheckCircle /></span>
              <h1>All set!</h1>
              <p className="lg-hint">Your password has been updated. Taking you to your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="lg-brand">
                <span className="lg-logo"><Logo size={20} /></span>
                <span className="lg-brand-text">
                  <b>Leave Nest</b>
                  <small>Staff Leave Management System</small>
                </span>
              </div>

              <span className="fl-icon"><FiShield /></span>
              <span className="lg-eyebrow">First sign-in</span>
              <h1>Set your new password</h1>
              <p className="lg-hint">
                Hi {user.name.split(" ")[0]}, for your security please replace the temporary password from your
                invitation email before continuing.
              </p>

              {error && (
                <div className="lg-error" role="alert">
                  <FiAlertCircle /> {error}
                </div>
              )}

              <div className="lg-field">
                <label htmlFor="fl-current">Temporary password</label>
                <div className="lg-pass">
                  <FiLock className="lg-ico" />
                  <input id="fl-current" name="current" type={show ? "text" : "password"} value={form.current}
                         onChange={handleChange} autoComplete="current-password" />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="fl-next">New password</label>
                <div className="lg-pass">
                  <FiLock className="lg-ico" />
                  <input id="fl-next" name="next" type={show ? "text" : "password"} value={form.next}
                         onChange={handleChange} autoComplete="new-password" />
                </div>
              </div>

              {form.next && (
                <div className="fl-strength">
                  <div className="fl-bars">
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} style={{ background: n <= strength ? strengthColors[strength] : undefined }} />
                    ))}
                  </div>
                  <small style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</small>
                </div>
              )}

              <div className="lg-field">
                <label htmlFor="fl-confirm">Confirm new password</label>
                <div className="lg-pass">
                  <FiLock className="lg-ico" />
                  <input id="fl-confirm" name="confirm" type={show ? "text" : "password"} value={form.confirm}
                         onChange={handleChange} autoComplete="new-password" />
                </div>
              </div>

              <ul className="fl-rules">
                {checks.map((c) => (
                  <li key={c.text} className={c.ok ? "ok" : ""}>
                    {c.ok ? <FiCheckCircle /> : <FiCircle />} {c.text}
                  </li>
                ))}
              </ul>

              <label className="lg-check fl-show">
                <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
                <span>Show passwords</span>
              </label>

              <button type="submit" className="lg-submit" disabled={!canSubmit}>
                Update password &amp; continue <FiArrowRight className="lg-arrow" />
              </button>

              <button type="button" className="fl-signout" onClick={handleSignOut}>
                <FiLogOut /> Sign out
              </button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}