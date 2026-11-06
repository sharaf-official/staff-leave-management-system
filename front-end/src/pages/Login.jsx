import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEye, FiEyeOff, FiAlertCircle, FiLifeBuoy, FiMail, FiPhone, FiX, FiClock, FiLock,
  FiUsers, FiUser, FiBriefcase, FiShield, FiChevronUp, FiChevronRight, FiLogIn, FiUserPlus,
  FiHeadphones, FiLayers, FiSend, FiCheckSquare, FiBarChart2, FiGlobe,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { DEMO_ACCOUNTS } from "../data/db";
import Logo from "../components/Logo";

const REMEMBER_KEY = "remembered-email";
const APP_VERSION = "1.0.0";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TICKS = 48;

// Public support details shown in the Help popup. Edit them here, in one place.
const SUPPORT = {
  email: "leavenest.support@gmail.com",
  phone: "+94 77 57 31 456", 
  website: "https://www.sharafizam.com",
  websiteLabel: "www.sharafizam.com",
  hours: "Mon - Fri, 9:00 AM - 6:00 PM (Sri Lanka time)",
};

const demoRoles = [
  { role: "employee", label: "Employee", icon: <FiUser />, color: "#38bdf8" },
  { role: "manager", label: "Manager", icon: <FiBriefcase />, color: "#a78bfa" },
  { role: "admin", label: "Admin", icon: <FiShield />, color: "#fb7185" },
];

const points = [
  { icon: <FiSend />, title: "Apply in seconds", text: "Submit leave requests with instant date and balance checks." },
  { icon: <FiCheckSquare />, title: "Quick approvals", text: "Managers review, comment and decide in one click." },
  { icon: <FiBarChart2 />, title: "Clear reports", text: "Admins track leave by team, type and status." },
];

const isDemoEmail = (value) =>
  DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === String(value).trim().toLowerCase());

const readRemembered = () => {
  try {
    const saved = localStorage.getItem(REMEMBER_KEY) || "";
    return isDemoEmail(saved) ? "" : saved; // never pre-fill demo accounts
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
  const [showAbout, setShowAbout] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoRef = useRef(null);
  const submitRef = useRef(null);

  // close popups with Esc
  useEffect(() => {
    if (!showHelp && !showAbout) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowHelp(false);
        setShowAbout(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHelp, showAbout]);

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
    const account = DEMO_ACCOUNTS.find((u) => u.role === role);
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

      try {
        if (remember && !isDemoEmail(email)) localStorage.setItem(REMEMBER_KEY, email.trim());
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
    <div className="lg-page ln-page">
      <div className="ln-bg" aria-hidden="true" />

      <main className="ln-main">
        {/* LEFT: logo + tagline */}
        <section className="ln-brand">
          <img className="ln-logo" src="/logo-full.png" alt="Leave Nest" />
          <p className="ln-tags">
            <span>Manage</span><i aria-hidden="true" />
            <span>Request</span><i aria-hidden="true" />
            <span>Stay Organized</span>
          </p>
          <p className="ln-motto">
            <span aria-hidden="true" /> Your Leave, Our Priority <span aria-hidden="true" />
          </p>
        </section>

        {/* RIGHT: login card */}
        <section className="ln-wrap">
          <form className="ln-card" onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <span className="ln-badge" aria-hidden="true"><FiUsers /></span>

            <fieldset className="lg-fieldset" disabled={loading}>
              <h1>Welcome <em>Back</em></h1>
              <p className="ln-sub">Sign in to your account to continue</p>

              {error && (
                <div className="ln-error" role="alert">
                  <FiAlertCircle /> {error}
                </div>
              )}

              <div className="ln-field">
                <label htmlFor="ln-email" className="ln-sr">Email</label>
                <div className="ln-input">
                  <FiMail aria-hidden="true" />
                  <input
                    id="ln-email"
                    type="email"
                    className={flash ? "ln-flash" : ""}
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="ln-field">
                <label htmlFor="ln-password" className="ln-sr">Password</label>
                <div className="ln-input">
                  <FiLock aria-hidden="true" />
                  <input
                    id="ln-password"
                    type={showPassword ? "text" : "password"}
                    className={flash ? "ln-flash" : ""}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="ln-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
              </div>

              <div className="ln-row">
                <label className="ln-check">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <button type="button" className="ln-link" onClick={() => setShowForgot(!showForgot)}>
                  Forgot password?
                </button>
              </div>

              {showForgot && (
                <p className="ln-info">Please contact your administrator or HR to reset your password.</p>
              )}

              <button type="submit" className="ln-submit" disabled={loading} ref={submitRef}>
                {loading ? (
                  <>
                    <span className="lg-spinner" /> Signing in...
                  </>
                ) : (
                  <>
                    <FiLogIn /> Sign In
                  </>
                )}
              </button>

              <div className="ln-or"><span>or</span></div>

              <Link to="/register-company" className="ln-company">
                <FiUserPlus className="ln-company-ico" aria-hidden="true" />
                <span className="ln-company-text">
                  <b>Add your company here</b>
                  <small>Have 10 or more staff? Register in 2 minutes</small>
                </span>
                <FiChevronRight aria-hidden="true" />
              </Link>
            </fieldset>

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
        </section>
      </main>

      {/* footer */}
      <footer className="ln-footer">
        <button type="button" className="ln-foot" onClick={() => setShowAbout(true)}>
          <FiShield /> Secure &amp; Reliable
        </button>
        <span className="ln-sep" aria-hidden="true" />
        <button type="button" className="ln-foot" onClick={() => setShowHelp(true)}>
          <FiHeadphones /> Help &amp; Support
        </button>
        <span className="ln-sep" aria-hidden="true" />
        <span className="ln-foot ln-static"><FiLayers /> System v{APP_VERSION}</span>
      </footer>

      {/* demo accounts (bottom-right) */}
      <div className="lg-demo" ref={demoRef}>
        {showDemo && (
          <div className="lg-demo-panel" role="menu" aria-label="Demo accounts">
            <h3>Try a demo account</h3>
            <p>No sign-up needed. Pick a role and the login details are filled in for you.</p>
            {demoRoles.map((d) => {
              const account = DEMO_ACCOUNTS.find((u) => u.role === d.role);
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

      {/* about popup */}
      {showAbout && (
        <div className="lg-modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="lg-modal" role="dialog" aria-modal="true" aria-labelledby="lg-about-title" onClick={(e) => e.stopPropagation()}>
            <button className="lg-modal-close" onClick={() => setShowAbout(false)} aria-label="Close" autoFocus>
              <FiX />
            </button>
            <div className="lg-about-head">
              <span className="lg-hero-logo small"><Logo size={34} /></span>
              <div>
                <h2 id="lg-about-title">Leave Nest</h2>
                <p className="lg-modal-sub">Staff Leave Management System</p>
              </div>
            </div>
            <p className="lg-about-text">
              Leave Nest replaces paper forms and spreadsheets with one secure web application for applying for,
              approving and tracking staff leave.
            </p>
            {points.map((p) => (
              <div className="lg-contact lg-about-point" key={p.title}>
                <span className="lg-point-icon">{p.icon}</span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </div>
            ))}
            <div className="lg-roles"><span>Employee</span><span>Manager</span><span>Admin</span></div>
            <p className="lg-modal-version">Leave Nest · v{APP_VERSION}</p>
          </div>
        </div>
      )}

      {/* help popup */}
      {showHelp && (
        <div className="lg-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="lg-modal" role="dialog" aria-modal="true" aria-labelledby="lg-help-title" onClick={(e) => e.stopPropagation()}>
            <button className="lg-modal-close" onClick={() => setShowHelp(false)} aria-label="Close help" autoFocus>
              <FiX />
            </button>
            <h2 id="lg-help-title"><FiLifeBuoy /> Help &amp; Support</h2>
            <p className="lg-modal-sub">Need help with Leave Nest? We are happy to help.</p>

            <div className="lg-contact">
              <h3>Leave Nest Support</h3>
              <p>Technical issues, login problems and general questions</p>
              <a href={`mailto:${SUPPORT.email}`}><FiMail /> {SUPPORT.email}</a>
              <a href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}><FiPhone /> {SUPPORT.phone}</a>
              <a href={SUPPORT.website} target="_blank" rel="noreferrer"><FiGlobe /> {SUPPORT.websiteLabel}</a>
            </div>

            <div className="lg-contact">
              <h3>Forgot password or account locked?</h3>
              <p>Please contact your company's HR or system administrator. They can reset your password or resend your invitation email.</p>
            </div>

            <p className="lg-hours"><FiClock /> Support hours: {SUPPORT.hours}</p>
            <p className="lg-modal-version">Leave Nest · Staff Leave Management System · v{APP_VERSION}</p>
          </div>
        </div>
      )}
    </div>
  );
}