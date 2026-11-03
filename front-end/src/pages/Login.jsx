import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar, FiEye, FiEyeOff, FiAlertCircle, FiLifeBuoy, FiMail, FiPhone, FiX, FiClock,
  FiUsers, FiUser, FiBriefcase, FiShield, FiChevronUp, FiLock, FiArrowRight,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { users } from "../data/mockData";

const REMEMBER_KEY = "remembered-email";
const APP_VERSION = "1.0.0";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TICKS = 48;

// Sample contacts: replace with your organisation's real details
const supportContacts = [
  { team: "HR Department", note: "Leave policy, accounts and password resets", email: "hr@company.com", phone: "+94 11 234 5678" },
  { team: "IT Support", note: "Login problems and technical issues", email: "itsupport@company.com", phone: "+94 11 234 5679" },
];

const demoRoles = [
  { role: "employee", label: "Employee", icon: <FiUser />, color: "#38bdf8" },
  { role: "manager", label: "Manager", icon: <FiBriefcase />, color: "#a78bfa" },
  { role: "admin", label: "Admin", icon: <FiShield />, color: "#fb7185" },
];

const readRemembered = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) || "";
  } catch {
    return "";
  }
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(readRemembered);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => readRemembered() !== "");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoRef = useRef(null);
  const submitRef = useRef(null);

  // close help popup with Esc
  useEffect(() => {
    if (!showHelp) return;
    const onKey = (e) => e.key === "Escape" && setShowHelp(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHelp]);

  // close demo panel on outside click / Esc
  useEffect(() => {
    if (!showDemo) return;
    const onClick = (e) => {
      if (demoRef.current && !demoRef.current.contains(e.target)) setShowDemo(false);
    };
    const onKey = (e) => e.key === "Escape" && setShowDemo(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showDemo]);

  const fillDemo = (role) => {
    const account = users.find((u) => u.role === role);
    if (!account) return;
    setEmail(account.email);
    setPassword(account.password);
    setShowPassword(false);
    setError("");
    setShowDemo(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
    setTimeout(() => submitRef.current && submitRef.current.focus(), 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      // Demo delay so the loading animation is visible. Remove when the real API is connected (E3).
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const result = await login(email.trim(), password);
      const ok = result === true || Boolean(result && (result.ok || result.success || result.email));
      if (!ok) {
        setError((result && (result.message || result.error)) || "Invalid email or password.");
        return;
      }

      // Remember me
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* storage blocked */
      }

      navigate("/dashboard");
    } catch (err) {
      setError((err && err.message) || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-page">
      {/* animated background */}
      <div className="lg-bg" aria-hidden="true">
        <span className="lg-shape lg-pill p1" />
        <span className="lg-shape lg-pill p2" />
        <span className="lg-shape lg-pill p3" />
        <span className="lg-shape lg-pill p4" />
        <span className="lg-shape lg-ring r1" />
        <span className="lg-shape lg-ring r2" />
        <span className="lg-shape lg-ring r3" />
        <span className="lg-shape lg-circle" />
        <span className="lg-shape lg-orb o1" />
        <span className="lg-shape lg-orb o2" />
        <span className="lg-shape lg-orb o3" />
      </div>

      <main className="lg-center">
               <form className="lg-card" onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <fieldset className="lg-fieldset" disabled={loading}>
            <div className="lg-brand">
              <span className="lg-logo"><FiCalendar /></span>
              <span>Staff Leave Management System</span>
            </div>

            <span className="lg-eyebrow">Login</span>
            <h1>Welcome Back</h1>
            <p className="lg-hint">Sign in to your account to continue.</p>

            {error && (
              <div className="lg-error" role="alert">
                <FiAlertCircle /> {error}
              </div>
            )}

            <div className="lg-field">
              <label htmlFor="lg-email">Email</label>
              <div className="lg-pass">
                <FiMail className="lg-ico" />
                <input
                  id="lg-email"
                  type="email"
                  className={flash ? "lg-flash" : ""}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="lg-field">
              <label htmlFor="lg-password">Password</label>
              <div className="lg-pass">
                <FiLock className="lg-ico" />
                <input
                  id="lg-password"
                  type={showPassword ? "text" : "password"}
                  className={flash ? "lg-flash" : ""}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="lg-row">
              <label className="lg-check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <button type="button" className="lg-link" onClick={() => setShowForgot(!showForgot)}>
                Forgot password?
              </button>
            </div>

            {showForgot && (
              <p className="lg-info">
                Please contact your administrator or HR to reset your password.
              </p>
            )}

            <button type="submit" className="lg-submit" disabled={loading} ref={submitRef}>
              {loading ? (
                <>
                  <span className="lg-spinner" /> Signing in...
                </>
              ) : (
                <>
                  Sign in <FiArrowRight className="lg-arrow" />
                </>
              )}
            </button>
          </fieldset>

          {/* ring loader overlay */}
          {loading && (
            <div className="lg-loading" role="status" aria-live="polite">
              <div className="lg-ring-loader">
                {Array.from({ length: TICKS }).map((_, i) => (
                  <span key={i} className="lg-tick" style={{ "--i": i }} />
                ))}
                <div className="lg-loading-text">
                  <b>Signing in...</b>
                  <small>Please wait</small>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* footer */}
      <footer className="lg-footer">
        <button type="button" className="lg-help-btn" onClick={() => setShowHelp(true)}>
          <FiLifeBuoy /> Help &amp; Support
        </button>
        <span className="lg-dot" aria-hidden="true">•</span>
        <span>Contact HR / IT Support</span>
        <span className="lg-dot" aria-hidden="true">•</span>
        <span className="lg-version">System version v{APP_VERSION}</span>
      </footer>

      {/* demo accounts (bottom-right) */}
      <div className="lg-demo" ref={demoRef}>
        {showDemo && (
          <div className="lg-demo-panel" role="menu" aria-label="Demo accounts">
            <h3>Try a demo account</h3>
            <p>No sign-up needed. Pick a role and the login details are filled in for you.</p>
            {demoRoles.map((d) => {
              const account = users.find((u) => u.role === d.role);
              return (
                <button
                  type="button"
                  key={d.role}
                  className="lg-tag"
                  role="menuitem"
                  style={{ "--c": d.color }}
                  onClick={() => fillDemo(d.role)}
                >
                  <span className="lg-tag-icon">{d.icon}</span>
                  <span className="lg-tag-text">
                    <b>{d.label}</b>
                    <small>{account ? account.email : ""}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          className={`lg-demo-btn ${showDemo ? "open" : ""}`}
          onClick={() => setShowDemo(!showDemo)}
          disabled={loading}
          aria-expanded={showDemo}
          aria-haspopup="menu"
        >
          <FiUsers /> Demo accounts <FiChevronUp className="lg-caret" />
        </button>
      </div>

      {/* help popup */}
      {showHelp && (
        <div className="lg-modal-overlay" onClick={() => setShowHelp(false)}>
          <div
            className="lg-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lg-help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="lg-modal-close" onClick={() => setShowHelp(false)} aria-label="Close help" autoFocus>
              <FiX />
            </button>
            <h2 id="lg-help-title"><FiLifeBuoy /> Help &amp; Support</h2>
            <p className="lg-modal-sub">Having trouble signing in? Reach out to the right team.</p>

            {supportContacts.map((c) => (
              <div className="lg-contact" key={c.team}>
                <h3>{c.team}</h3>
                <p>{c.note}</p>
                <a href={`mailto:${c.email}`}><FiMail /> {c.email}</a>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`}><FiPhone /> {c.phone}</a>
              </div>
            ))}

            <p className="lg-hours"><FiClock /> Support hours: Mon - Fri, 8:30 AM - 5:00 PM</p>
            <p className="lg-modal-version">Staff Leave Management System · v{APP_VERSION}</p>
          </div>
        </div>
      )}
    </div>
  );
}