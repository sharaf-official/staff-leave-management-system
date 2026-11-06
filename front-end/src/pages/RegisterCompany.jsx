import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiAlertCircle, FiMail, FiBriefcase, FiUser, FiUsers, FiClipboard,
} from "react-icons/fi";
import Logo from "../components/Logo";
import { registerCompany, getMailsTo } from "../data/db";

const DEMO = import.meta.env.VITE_DEMO_MODE !== "false";
const steps = [
  { label: "Company", icon: FiBriefcase },
  { label: "Admin", icon: FiUser },
  { label: "Manager", icon: FiUsers },
  { label: "Review", icon: FiClipboard },
];
const industries = ["Technology", "Retail", "Manufacturing", "Education", "Healthcare", "Finance", "Hospitality", "Construction", "Other"];
const sizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
};

export default function RegisterCompany() {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const [company, setCompany] = useState({
    name: "", registrationNo: "", industry: "Technology", size: "1-10", phone: "", email: "", address: "", city: "", country: "Sri Lanka",
  });
  const [admin, setAdmin] = useState({ name: "", email: "", phone: "" });
  const [manager, setManager] = useState({ name: "", email: "", department: "" });

  // field -> error key (admin/manager fields share names with company, so they use prefixed error keys)
  const bind = (state, setState, prefix = "") => (e) => {
    const { name, value } = e.target;
    setState({ ...state, [name]: value });
    setErrors({ ...errors, [prefix + name]: "" });
    setFormError("");
  };

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!company.name.trim()) e.name = "Enter the company name.";
      if (!company.phone.trim()) e.phone = "Enter a contact phone number.";
      if (!emailOk(company.email)) e.email = "Enter a valid company email.";
      if (!company.city.trim()) e.city = "Enter the city.";
    }
    if (s === 1) {
      if (!admin.name.trim()) e.aname = "Enter the admin's full name.";
      if (!emailOk(admin.email)) e.aemail = "Enter the admin's real email address.";
    }
    if (s === 2) {
      if (!manager.name.trim()) e.mname = "Enter the manager's full name.";
      if (!emailOk(manager.email)) e.memail = "Enter the manager's real email address.";
      else if (manager.email.trim().toLowerCase() === admin.email.trim().toLowerCase())
        e.memail = "Manager email must be different from the admin email.";
      if (!manager.department.trim()) e.mdepartment = "Enter the manager's department.";
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) return setErrors(e);
    setErrors({});
    setStep(step + 1);
  };

  const submit = () => {
    if (!confirm) return setFormError("Please confirm that the details are correct.");
    const res = registerCompany({ company, admin, manager });
    if (!res.ok) {
      setFormError(res.message);
      setStep(res.step);
      return;
    }
    setResult(res);
  };

  const err = (key) => errors[key] && <p className="rc-err">{errors[key]}</p>;

  const brand = (
    <div className="lg-brand">
      <span className="lg-logo"><Logo size={20} /></span>
      <span className="lg-brand-text"><b>Leave Nest</b><small>Staff Leave Management System</small></span>
    </div>
  );

  const shapes = (
    <div className="lg-bg" aria-hidden="true">
      <span className="lg-shape lg-pill p1" /><span className="lg-shape lg-pill p2" />
      <span className="lg-shape lg-ring r1" /><span className="lg-shape lg-ring r2" />
      <span className="lg-shape lg-circle" /><span className="lg-shape lg-orb o1" /><span className="lg-shape lg-orb o2" />
    </div>
  );

  /* ---------- success ---------- */
  if (result) {
    const mails = DEMO ? getMailsTo(result.recipients.map((r) => r.email)) : [];
    return (
      <div className="lg-page rc-page">
        {shapes}
        <main className="lg-center solo">
          <div className="lg-card rc-card" role="status">
            <div className="fl-done">
              <span className="fl-done-icon"><FiCheckCircle /></span>
              <h1>{result.company.name} is registered!</h1>
              <p className="lg-hint">We sent an invitation email with a temporary password to:</p>
            </div>
            <ul className="rc-sent">
              {result.recipients.map((r) => (
                <li key={r.email}><FiMail /><span><b>{r.role}</b> {r.name}<small>{maskEmail(r.email)}</small></span></li>
              ))}
            </ul>
            <p className="lg-hint">
              Open the email, sign in with the temporary password and choose your own password. The temporary password
              expires in 7 days.
            </p>

            {DEMO && (
              <details className="rc-preview">
                <summary>View invitation emails (demo preview)</summary>
                {mails.map((m) => (
                  <div className="rc-mail" key={m.id}>
                    <b>{m.subject}</b>
                    <small>To: {m.to}</small>
                    <pre>{m.body}</pre>
                  </div>
                ))}
              </details>
            )}

            <Link to="/login" className="lg-submit rc-go">Go to sign in <FiArrowRight className="lg-arrow" /></Link>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- wizard ---------- */
  return (
    <div className="lg-page rc-page">
      {shapes}
      <main className="lg-center solo">
        <div className="lg-card rc-card">
          {brand}
          <span className="lg-eyebrow">Register your company</span>
          <h1>Set up Leave Nest</h1>

          <ol className="rc-steps" aria-label="Registration progress">
            {steps.map((s, i) => (
              <li key={s.label} className={i === step ? "on" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
                <span>{i < step ? <FiCheck /> : <s.icon />}</span>
                <small>{s.label}</small>
              </li>
            ))}
          </ol>

          {formError && <div className="lg-error" role="alert"><FiAlertCircle /> {formError}</div>}

          {step === 0 && (
            <div className="rc-grid">
              <div className="rc-field rc-wide"><label htmlFor="c-name">Company name</label>
                <input id="c-name" name="name" value={company.name} onChange={bind(company, setCompany)} />{err("name")}</div>
              <div className="rc-field"><label htmlFor="c-reg">Registration no. (optional)</label>
                <input id="c-reg" name="registrationNo" value={company.registrationNo} onChange={bind(company, setCompany)} /></div>
              <div className="rc-field"><label htmlFor="c-ind">Industry</label>
                <select id="c-ind" name="industry" value={company.industry} onChange={bind(company, setCompany)}>
                  {industries.map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="rc-field"><label htmlFor="c-size">Company size</label>
                <select id="c-size" name="size" value={company.size} onChange={bind(company, setCompany)}>
                  {sizes.map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="rc-field"><label htmlFor="c-phone">Phone</label>
                <input id="c-phone" name="phone" value={company.phone} onChange={bind(company, setCompany)} placeholder="+94 11 234 5678" />{err("phone")}</div>
              <div className="rc-field rc-wide"><label htmlFor="c-email">Company email</label>
                <input id="c-email" name="email" type="email" value={company.email} onChange={bind(company, setCompany)} />{err("email")}</div>
              <div className="rc-field rc-wide"><label htmlFor="c-addr">Address</label>
                <input id="c-addr" name="address" value={company.address} onChange={bind(company, setCompany)} /></div>
              <div className="rc-field"><label htmlFor="c-city">City</label>
                <input id="c-city" name="city" value={company.city} onChange={bind(company, setCompany)} />{err("city")}</div>
              <div className="rc-field"><label htmlFor="c-country">Country</label>
                <input id="c-country" name="country" value={company.country} onChange={bind(company, setCompany)} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="rc-grid">
              <p className="lg-hint rc-wide">The admin manages employees, departments and leave types. Use a real email: the invitation is sent there.</p>
              <div className="rc-field rc-wide"><label htmlFor="a-name">Admin full name</label>
                <input id="a-name" name="name" value={admin.name} onChange={bind(admin, setAdmin, "a")} />{err("aname")}</div>
              <div className="rc-field"><label htmlFor="a-email">Admin email</label>
                <input id="a-email" name="email" type="email" value={admin.email} onChange={bind(admin, setAdmin, "a")} />{err("aemail")}</div>
              <div className="rc-field"><label htmlFor="a-phone">Phone (optional)</label>
                <input id="a-phone" name="phone" value={admin.phone} onChange={bind(admin, setAdmin, "a")} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="rc-grid">
              <p className="lg-hint rc-wide">The manager approves leave requests. You can add more managers later from the Employees page.</p>
              <div className="rc-field rc-wide"><label htmlFor="m-name">Manager full name</label>
                <input id="m-name" name="name" value={manager.name} onChange={bind(manager, setManager, "m")} />{err("mname")}</div>
              <div className="rc-field"><label htmlFor="m-email">Manager email</label>
                <input id="m-email" name="email" type="email" value={manager.email} onChange={bind(manager, setManager, "m")} />{err("memail")}</div>
              <div className="rc-field"><label htmlFor="m-dep">Department</label>
                <input id="m-dep" name="department" value={manager.department} onChange={bind(manager, setManager, "m")} />{err("mdepartment")}</div>
            </div>
          )}

          {step === 3 && (
            <div className="rc-review">
              <section><h3>Company</h3>
                <p><b>{company.name}</b></p>
                <p>{company.industry} · {company.size} staff</p>
                <p>{[company.address, company.city, company.country].filter(Boolean).join(", ")}</p>
                <p>{company.phone} · {company.email}</p></section>
              <section><h3>Admin</h3><p><b>{admin.name}</b></p><p>{admin.email}</p></section>
              <section><h3>Manager</h3><p><b>{manager.name}</b> · {manager.department}</p><p>{manager.email}</p></section>
              <label className="lg-check">
                <input type="checkbox" checked={confirm} onChange={(e) => { setConfirm(e.target.checked); setFormError(""); }} />
                <span>I confirm these details are correct and I am allowed to register this company.</span>
              </label>
            </div>
          )}

          <div className="rc-nav">
            {step > 0 ? (
              <button type="button" className="rc-back" onClick={() => { setStep(step - 1); setFormError(""); }}><FiArrowLeft /> Back</button>
            ) : (
              <Link to="/login" className="rc-back"><FiArrowLeft /> Back to sign in</Link>
            )}
            {step < 3 ? (
              <button type="button" className="lg-submit rc-next" onClick={next}>Continue <FiArrowRight className="lg-arrow" /></button>
            ) : (
              <button type="button" className="lg-submit rc-next" onClick={submit}>Register company <FiCheck /></button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}