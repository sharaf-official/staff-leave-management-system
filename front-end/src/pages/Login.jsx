import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setServerError("");
    if (Object.keys(v).length > 0) return;
    if (login(form.email, form.password)) navigate("/dashboard");
    else setServerError("Invalid email or password");
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="hero-content">
          <div className="logo-box"><FiCalendar /></div>
          <h1>Staff Leave Management</h1>
          <p>Apply, approve and track leave in one simple place.</p>
          <ul>
            <li>Live leave balance</li>
            <li>Quick manager approvals</li>
            <li>Email notifications</li>
          </ul>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-box" onSubmit={handleSubmit} noValidate>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to your account</p>
          {serverError && <div className="alert alert-error">{serverError}</div>}

          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
                   className={errors.email ? "invalid" : ""} placeholder="name@company.com" />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
                   className={errors.password ? "invalid" : ""} placeholder="Enter your password" />
            {errors.password && <div className="error-text">{errors.password}</div>}
          </div>

          <button className="btn btn-full" type="submit">Sign in</button>

          <div className="demo">
            Demo accounts (password 123456):<br />
            employee@company.com<br />manager@company.com<br />admin@company.com
          </div>
        </form>
      </div>
    </div>
  );
}