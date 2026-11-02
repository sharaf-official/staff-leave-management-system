import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const demoAccounts = [
  { label: "Employee", email: "employee@company.com" },
  { label: "Manager", email: "manager@company.com" },
  { label: "Admin", email: "admin@company.com" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerError("");
  };

  const fillDemo = (email) => {
    setForm({ email, password: "123456" });
    setErrors({});
    setServerError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setServerError("");
    setInfo("");
    if (Object.keys(v).length > 0) return;
    if (login(form.email, form.password)) navigate("/dashboard");
    else setServerError("Invalid email or password");
  };

  return (
    <div className="auth-page">
      <div className="auth-stage">
        <span className="shape zig"><i></i><i></i></span>
        <span className="shape zig small"><i></i><i></i></span>
        <span className="shape ring ring-a"></span>
        <span className="shape ring ring-b"></span>
        <span className="shape loop"></span>
        <span className="shape blob"></span>
        <span className="shape wave w1"></span>
        <span className="shape wave w2"></span>

        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <div className="auth-brand">
            <span className="logo-mini"><FiCalendar /></span>
            <span>Staff Leave Management System</span>
          </div>
          <h2>Login</h2>

          {serverError && <div className="alert alert-error">{serverError}</div>}
          {info && <div className="auth-info">{info}</div>}

          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
                   className={errors.email ? "invalid" : ""} placeholder="name@company.com" />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="pw-wrap">
              <input name="password" type={showPassword ? "text" : "password"} value={form.password}
                     onChange={handleChange} className={errors.password ? "invalid" : ""}
                     placeholder="Enter your password" />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}
                      aria-label="Show or hide password">
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <div className="error-text">{errors.password}</div>}
          </div>

          <div className="auth-row">
            <button type="button" className="link-btn"
                    onClick={() => setInfo("Please contact your administrator to reset your password.")}>
              Forgot password?
            </button>
          </div>

          <button className="auth-btn" type="submit">Sign in</button>

          <div className="auth-divider">or try a demo account</div>
          <div className="demo-chips">
            {demoAccounts.map((d) => (
              <button key={d.label} type="button" className="demo-chip" onClick={() => fillDemo(d.email)}>
                {d.label}
              </button>
            ))}
          </div>
          <p className="demo-note">Demo password: 123456</p>
        </form>
      </div>
    </div>
  );
}