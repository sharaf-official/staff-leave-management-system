import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiSearch, FiEdit2, FiSend, FiSlash, FiCheckCircle, FiX, FiRefreshCw, FiMail } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getDb, addUser, editUser, setUserStatus, resendInvite, generateTempPassword } from "../data/db";

const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({
  name: "", email: "", phone: "", jobTitle: "", department: "",
  role: "employee", managerId: "", joinDate: today(), tempPassword: "",
});
const statusText = { active: "Active", invited: "Invited", disabled: "Disabled" };

export default function Users() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | { mode: "add" | "edit", id? }
  const [form, setForm] = useState(blank());
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const people = useMemo(() => getDb().users.filter((u) => u.companyId === user.companyId), [user.companyId, version]);
  const managers = people.filter((u) => u.role === "manager" || u.role === "admin");
  const nameOf = (id) => people.find((p) => p.id === id)?.name || "-";
  const departments = [...new Set(["IT", "HR", "Finance", "Sales", "Operations", "Marketing", ...people.map((p) => p.department)])];

  const rows = people.filter((p) => {
    const q = query.trim().toLowerCase();
    const matches = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    return matches && (filter === "all" || p.status === filter);
  });

  const refresh = () => setVersion((v) => v + 1);
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
      name: p.name, email: p.email, phone: p.profile?.phone || "", jobTitle: p.jobTitle || "",
      department: p.department || "", role: p.role, managerId: p.managerId ?? "", joinDate: p.joinDate, tempPassword: "",
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

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    const managerId = form.role === "employee" ? Number(form.managerId) : null;

    if (modal.mode === "add") {
      const result = addUser({ ...form, managerId, companyId: user.companyId, invitedBy: user.name });
      if (!result.ok) return setErrors({ email: result.message });
      notify(`Invitation email queued for ${form.email.trim()}.`, true);
    } else {
      editUser(modal.id, { ...form, managerId });
      notify("Employee details updated.");
    }
    setModal(null);
    refresh();
  };

  const toggleDisable = (p) => {
    setUserStatus(p.id, p.status !== "disabled");
    notify(p.status === "disabled" ? `${p.name} re-enabled.` : `${p.name} disabled. They can no longer sign in.`);
    refresh();
  };

  const resend = (p) => {
    resendInvite(p.id, user.name);
    notify(`New temporary password emailed to ${p.email}.`, true);
    refresh();
  };

  return (
    <div className="ue-page">
      <div className="ue-head">
        <div>
          <h2>Employees</h2>
          <p>Add staff, assign their manager and send secure invitations.</p>
        </div>
        <button className="btn" onClick={openAdd}><FiPlus /> Add employee</button>
      </div>

      {toast && (
        <div className="rv-toast" role="status">
          {toast.text}{" "}
          {toast.link && <Link to="/outbox" className="ue-link"><FiMail /> View in Email Outbox</Link>}
        </div>
      )}

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
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan="6" className="ue-empty">No employees match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
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
                <label htmlFor="ue-phone">Phone</label>
                <input id="ue-phone" name="phone" value={form.phone} onChange={change} placeholder="+94 77 123 4567" />
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
                  <small className="ue-hint">Emailed to the employee. They must change it at first sign-in (valid 7 days).</small>
                  {errors.tempPassword && <p className="rv-error">{errors.tempPassword}</p>}
                </div>
              )}
            </div>

            <div className="ue-modal-foot">
              <button type="button" className="ue-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn">
                {modal.mode === "add" ? <><FiSend /> Add &amp; send invitation</> : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}