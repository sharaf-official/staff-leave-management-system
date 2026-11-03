import { useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import { staffList, departments } from "../data/mockData";

const emptyForm = { name: "", email: "", role: "employee", department: "IT", password: "" };
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Users() {
  const [users, setUsers] = useState(staffList);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);   // null = add mode
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [message, setMessage] = useState("");

  const shown = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (u) => {
    setForm({ ...u, password: "" });
    setEditingId(u.id);
    setErrors({});
    setShowForm(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Name must be at least 3 characters.";
    if (!emailRegex.test(form.email)) e.email = "Enter a valid email address.";
    else if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editingId))
      e.email = "This email is already used.";
    if (editingId === null && form.password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleSave = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    if (editingId === null) {
      const newUser = {
        id: Date.now(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        department: form.department,
      };
      setUsers([...users, newUser]);
      flash("User added successfully.");
    } else {
      setUsers(
        users.map((u) =>
          u.id === editingId
            ? { ...u, name: form.name.trim(), email: form.email.trim(), role: form.role, department: form.department }
            : u
        )
      );
      flash("User updated successfully.");
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    setUsers(users.filter((u) => u.id !== toDelete.id));
    flash(`${toDelete.name} was deleted.`);
    setToDelete(null);
  };

  return (
    <div>
      <div className="card">
        <div className="rv-head">
          <h3 className="section-title">Manage users ({users.length})</h3>
          <div className="us-tools">
            <div className="us-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn us-add" onClick={openAdd}><FiPlus /> Add user</button>
          </div>
        </div>

        {message && <div className="rv-toast">{message}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--muted)" }}>No users found.</td></tr>
              )}
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>{u.department}</td>
                  <td>
                    <div className="us-actions">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(u)}><FiEdit2 /></button>
                      <button
                        className="icon-btn danger"
                        title={u.role === "admin" ? "Admin cannot be deleted" : "Delete"}
                        disabled={u.role === "admin"}
                        onClick={() => setToDelete(u)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="rv-overlay" onClick={() => setShowForm(false)}>
          <form className="rv-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave} noValidate>
            <h3>{editingId === null ? "Add new user" : "Edit user"}</h3>

            <div className="us-field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} />
              {errors.name && <p className="rv-error">{errors.name}</p>}
            </div>

            <div className="us-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
              {errors.email && <p className="rv-error">{errors.email}</p>}
            </div>

            <div className="us-row">
              <div className="us-field">
                <label htmlFor="role">Role</label>
                <select id="role" name="role" value={form.role} onChange={handleChange}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="us-field">
                <label htmlFor="department">Department</label>
                <select id="department" name="department" value={form.department} onChange={handleChange}>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {editingId === null && (
              <div className="us-field">
                <label htmlFor="password">Temporary password</label>
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} />
                {errors.password && <p className="rv-error">{errors.password}</p>}
              </div>
            )}

            <div className="rv-actions">
              <button type="button" className="btn rv-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn">{editingId === null ? "Add user" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <div className="rv-overlay" onClick={() => setToDelete(null)}>
          <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete user?</h3>
            <p>Are you sure you want to delete <b>{toDelete.name}</b>? This action cannot be undone.</p>
            <div className="rv-actions">
              <button className="btn rv-cancel" onClick={() => setToDelete(null)}>Cancel</button>
              <button className="btn rv-reject" onClick={confirmDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}