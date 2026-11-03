import { useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { leaveTypeList } from "../data/mockData";

const emptyForm = { name: "", days: "" };

export default function LeaveTypes() {
  const [types, setTypes] = useState(leaveTypeList);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [message, setMessage] = useState("");

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setErrors({}); setShowForm(true); };
  const openEdit = (t) => { setForm({ name: t.name, days: String(t.days) }); setEditingId(t.id); setErrors({}); setShowForm(true); };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const err = {};
    const name = form.name.trim();
    const days = Number(form.days);
    if (name.length < 2) err.name = "Name must be at least 2 characters.";
    else if (types.some((t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== editingId))
      err.name = "This leave type already exists.";
    if (form.days === "" || !Number.isInteger(days) || days < 1 || days > 365)
      err.days = "Enter whole days between 1 and 365.";
    if (Object.keys(err).length > 0) return setErrors(err);

    if (editingId === null) {
      setTypes([...types, { id: Date.now(), name, days }]);
      flash("Leave type added.");
    } else {
      setTypes(types.map((t) => (t.id === editingId ? { ...t, name, days } : t)));
      flash("Leave type updated.");
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    setTypes(types.filter((t) => t.id !== toDelete.id));
    flash(`${toDelete.name} leave type deleted.`);
    setToDelete(null);
  };

  return (
    <div>
      <div className="card">
        <div className="rv-head">
          <h3 className="section-title">Leave types ({types.length})</h3>
          <button className="btn us-add" onClick={openAdd}><FiPlus /> Add leave type</button>
        </div>

        {message && <div className="rv-toast">{message}</div>}

        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Leave type</th><th>Days per year</th><th>Actions</th></tr></thead>
            <tbody>
              {types.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--muted)" }}>No leave types yet.</td></tr>
              )}
              {types.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td>{t.name}</td>
                  <td>{t.days}</td>
                  <td>
                    <div className="us-actions">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(t)}><FiEdit2 /></button>
                      <button className="icon-btn danger" title="Delete" onClick={() => setToDelete(t)}><FiTrash2 /></button>
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
          <form className="rv-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={handleSave} noValidate>
            <h3>{editingId === null ? "Add leave type" : "Edit leave type"}</h3>
            <div className="us-field">
              <label htmlFor="lname">Leave type name</label>
              <input id="lname" name="name" value={form.name} onChange={handleChange} />
              {errors.name && <p className="rv-error">{errors.name}</p>}
            </div>
            <div className="us-field">
              <label htmlFor="ldays">Days per year</label>
              <input id="ldays" name="days" type="number" min="1" value={form.days} onChange={handleChange} />
              {errors.days && <p className="rv-error">{errors.days}</p>}
            </div>
            <div className="rv-actions">
              <button type="button" className="btn rv-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn">{editingId === null ? "Add" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <div className="rv-overlay" onClick={() => setToDelete(null)}>
          <div className="rv-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Delete leave type?</h3>
            <p>Are you sure you want to delete <b>{toDelete.name}</b> leave?</p>
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