import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  FiPlus, FiSearch, FiEdit2, FiSend, FiSlash, FiCheckCircle, FiX, FiRefreshCw, FiMail, FiCopy, FiMessageCircle,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { generateTempPassword } from "../data/db";

const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({
  name: "", email: "", phone: "", jobTitle: "", department: "",
  role: "employee", managerId: "", joinDate: today(), tempPassword: "",
});
const statusText = { active: "Active", invited: "Invited", disabled: "Disabled" };

const waNumber = (phone) => {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("94")) return d;
  if (d.startsWith("0")) return `94${d.slice(1)}`;
  return d;
};

const shareText = (s) =>
`Hi ${s.name.split(" ")[0]},

You have been added to Leave Nest.

Sign in: ${window.location.origin}/login
Email: ${s.email}
Temporary password: ${s.tempPassword}

You must change this password the first time you sign in. It is valid for 7 days.`;

export default function Users() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank());
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);

  const load = useCallback(async () => {
    try {
      const { users } = await api("/users");
      setPeople(users);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const managers = people.filter((u) => u.role === "manager" || u.role === "admin");
  const nameOf = (id) => people.find((p) => p.id === id)?.name || "-";
  const departments = [...new Set(["IT", "HR", "Finance", "Sales", "Operations", "Marketing", ...people.map((p) => p.department).filter(Boolean)])];

  const rows = people.filter((p) => {
    const q = query.trim().toLowerCase();
    const matches = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    return matches && (filter === "all" || p.status === filter);
  });

  const notify = (text, link) => {
    setToast({ text, link });
    setTimeout(() => setToast(null), 6000);
  };

  const openAdd = () => {
    setForm({ ...blank(), tempPassword: generateTempPassword() });
    setErrors({});
    setModal({ mode: "add" });
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, email: p.email, phone: p.phone || "", jobTitle: p.jobTitle || "",
      department: p.department || "", role: p.role, managerId: p.managerId ?? "",
      joinDate: (p.joinDate || "").slice(0, 10), tempPassword: "",
    });
    setErrors({});
    setModal({ mode: "edit", id: p.id });
  };

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter the full name.";
    if (modal.mode === "add") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid work email.";
      if (form.tempPassword.length < 8 || !/[A-Za-z]/.test(form.tempPassword) || !/\d/.test(form.tempPassword))
        e.tempPassword = "At least 8 characters with a letter and a number.";
    }
    if (!form.department.trim()) e.department = "Choose or type a department.";
    if (form.role === "employee" && !form.managerId) e.managerId = "Select the manager who approves this employee's leave.";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (saving) return;
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    const managerId = form.role === "employee" ? Number(form.managerId) : null;

    setSaving(true);
    try {
      if (modal.mode === "add") {
        await api("/users", { method: "POST", body: { ...form, managerId } });
        notify(`Invitation email queued for ${form.email.trim()}.`, true);
        setShareInfo({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, tempPassword: form.tempPassword });
      } else {
        await api(`/users/${modal.id}`, { method: "PUT", body: { ...form, managerId } });
        notify("Employee details updated.");
      }
      setModal(null);
      await load();
    } catch (err) {
      setErrors(modal.mode === "add" && err.status === 409 ? { email: err.message } : { name: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleDisable = async (p) => {
    try {
      await api(`/users/${p.id}/status`, { method: "PATCH", body: { disabled: p.status !== "disabled" } });
      notify(p.status === "disabled" ? `${p.name} re-enabled.` : `${p.name} disabled. They can no longer sign in.`);
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  const resend = async (p) => {
    try {
      const r = await api(`/users/${p.id}/resend`, { method: "POST" });
      notify(`New temporary password emailed to ${p.email}.`, true);
      setShareInfo({ name: p.name, email: p.email, phone: p.phone, tempPassword: r.tempPassword });
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <div className="ue-page">
      <div className="ue-head">
        <div>
          <h2>Employees</h2>
          <p>Add staff, assign their manager and send secure invitations.</p>
        </div>
        {user.role === "admin" && (
          <button className="btn" onClick={openAdd}><FiPlus /> Add employee</button>
        )}
      </div>

      {toast && (
        <div className="rv-toast" role="status">
          {toast.text}{" "}
          {toast.link && <Link to="/outbox" className="ue-link"><FiMail /> View in Email Outbox</Link>}
        </div>
      )}
      {loadError && <div className="rv-toast" role="alert">{loadError}</div>}

      <div className="card">
        <div className="ue-tools">
          <div className="ue-search">
            <FiSearch />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" aria-label="Search employees" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </select>
          <span className="ue-count">{rows.length} of {people.length}</span>
        </div>

        <div className="ue-scroll">
          <table className="ue-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Department</th><th>Manager</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="ue-name">
                      <span className="ue-av">{p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
                      <div><b>{p.name}</b><small>{p.email}</small></div>
                    </div>
                  </td>
                  <td><span className={`role-badge role-${p.role}`}>{p.role}</span></td>
                  <td>{p.department || "-"}</td>
                  <td>{p.managerId ? nameOf(p.managerId) : "-"}</td>
                  <td><span className={`ue-chip ue-${p.status}`}>{statusText[p.status]}</span></td>
                  <td>
                    {user.role === "admin" && (
                      <div className="ue-actions">
                        <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} title="Edit"><FiEdit2 /></button>
                        {p.status === "invited" && (
                          <button onClick={() => resend(p)} aria-label={`Resend invitation to ${p.name}`} title="Resend invitation"><FiSend /></button>
                        )}
                        {p.id !== user.id && (
                          <button onClick={() => toggleDisable(p)} aria-label={`${p.status === "disabled" ? "Enable" : "Disable"} ${p.name}`}
                                  title={p.status === "disabled" ? "Enable" : "Disable"}>
                            {p.status === "disabled" ? <FiCheckCircle /> : <FiSlash />}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan="6" className="ue-empty">No employees match your search.</td></tr>
              )}
              {loading && (
                <tr><td colSpan="6" className="ue-empty">Loading...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && createPortal(
        <div className="ue-overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="ue-modal" onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-label={modal.mode === "add" ? "Add employee" : "Edit employee"}>
            <div className="ue-modal-head">
              <h3>{modal.mode === "add" ? "Add employee" : "Edit employee"}</h3>
              <button type="button" onClick={() => setModal(null)} aria-label="Close"><FiX /></button>
            </div>

            <div className="ue-grid">
              <div className="us-field">
                <label htmlFor="ue-name">Full name</label>
                <input id="ue-name" name="name" value={form.name} onChange={change} />
                {errors.name && <p className="rv-error">{errors.name}</p>}
              </div>
              <div className="us-field">
                <label htmlFor="ue-email">Work email</label>
                <input id="ue-email" name="email" type="email" value={form.email} onChange={change}
                       disabled={modal.mode === "edit"} placeholder="name@company.com" />
                {errors.email && <p className="rv-error">{errors.email}</p>}
              </div>
              <div className="us-field">
                <label htmlFor="ue-phone">Phone (WhatsApp)</label>
                <input id="ue-phone" name="phone" value={form.phone} onChange={change} placeholder="077 123 4567" />
              </div>
              <div className="us-field">
                <label htmlFor="ue-job">Job title</label>
                <input id="ue-job" name="jobTitle" value={form.jobTitle} onChange={change} />
              </div>
              <div className="us-field">
                <label htmlFor="ue-dep">Department</label>
                <input id="ue-dep" name="department" list="ue-deps" value={form.department} onChange={change} />
                <datalist id="ue-deps">{departments.map((d) => <option key={d} value={d} />)}</datalist>
                {errors.department && <p className="rv-error">{errors.department}</p>}
              </div>
              <div className="us-field">
                <label htmlFor="ue-role">Role</label>
                <select id="ue-role" name="role" value={form.role} onChange={change}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === "employee" && (
                <div className="us-field">
                  <label htmlFor="ue-mgr">Reporting manager</label>
                  <select id="ue-mgr" name="managerId" value={form.managerId} onChange={change}>
                    <option value="">Select manager</option>
                    {managers.filter((m) => m.id !== modal.id).map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                  <small className="ue-hint">Leave requests are emailed to this manager.</small>
                  {errors.managerId && <p className="rv-error">{errors.managerId}</p>}
                </div>
              )}
              <div className="us-field">
                <label htmlFor="ue-join">Join date</label>
                <input id="ue-join" name="joinDate" type="date" value={form.joinDate} onChange={change} disabled={modal.mode === "edit"} />
              </div>
              {modal.mode === "add" && (
                <div className="us-field ue-wide">
                  <label htmlFor="ue-temp">Temporary password</label>
                  <div className="ue-temp">
                    <input id="ue-temp" name="tempPassword" value={form.tempPassword} onChange={change} />
                    <button type="button" className="ue-gen" onClick={() => setForm({ ...form, tempPassword: generateTempPassword() })}>
                      <FiRefreshCw /> Generate
                    </button>
                  </div>
                  <small className="ue-hint">Shared with the employee. They must change it at first sign-in (valid 7 days).</small>
                  {errors.tempPassword && <p className="rv-error">{errors.tempPassword}</p>}
                </div>
              )}
            </div>

            <div className="ue-modal-foot">
              <button type="button" className="ue-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving..." : modal.mode === "add" ? <><FiSend /> Add &amp; send invitation</> : "Save changes"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {shareInfo && createPortal(
        <div className="ue-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShareInfo(null)}>
          <div className="ue-modal" role="dialog" aria-modal="true" aria-label="Share login details">
            <div className="ue-modal-head">
              <h3>Share login details</h3>
              <button type="button" onClick={() => setShareInfo(null)} aria-label="Close"><FiX /></button>
            </div>
            <p className="ue-hint">
              Send these to {shareInfo.name} on WhatsApp. The temporary password is shown only now,
              so share it before closing.
            </p>
            <pre className="ue-body ue-share">{shareText(shareInfo)}</pre>
            <div className="ue-modal-foot">
              <button
                type="button"
                className="ue-ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(shareText(shareInfo));
                  notify("Login details copied.");
                }}
              >
                <FiCopy /> Copy
              </button>
              <a
                className="btn ue-wa"
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/${waNumber(shareInfo.phone)}?text=${encodeURIComponent(shareText(shareInfo))}`}
              >
                <FiMessageCircle /> Share on WhatsApp
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}