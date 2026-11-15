import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { api } from "../api";

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { departments } = await api("/departments");
      setDepts(departments);
    } catch (err) {
      setMessage(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const openAdd = () => { setName(""); setEditingId(null); setError(""); setShowForm(true); };
  const openEdit = (d) => { setName(d.name); setEditingId(d.id); setError(""); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (busy) return;
    const value = name.trim();
    if (value.length < 2) return setError("Department name must be at least 2 characters.");
    setBusy(true);
    try {
      if (editingId === null) {
        await api("/departments", { method: "POST", body: { name: value } });
        flash("Department added.");
      } else {
        await api(`/departments/${editingId}`, { method: "PUT", body: { name: value } });
        flash("Department updated.");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api(`/departments/${toDelete.id}`, { method: "DELETE" });
      flash(`${toDelete.name} department deleted.`);
      await load();
    } catch (err) {
      flash(err.message);
    }
    setToDelete(null);
  };

  return (
    <div>
      <div className="card">
        <div className="rv-head">
          <h3 className="section-title">Departments ({depts.length})</h3>
          <button className="btn us-add" onClick={openAdd}><FiPlus /> Add department</button>
        </div>

        {message && <div className="rv-toast">{message}</div>}

        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Department</th><th>Staff</th><th>Actions</th></tr></thead>
            <tbody>
              {depts.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--muted)" }}>No departments yet.</td></tr>
              )}
              {depts.map((d, i) => (
                <tr key={d.id}>
                  <td>{i + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.staff}</td>
                  <td>
                    <div className="us-actions">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(d)}><FiEdit2 /></button>
                      <button
                        className="icon-btn danger"
                        title={d.staff > 0 ? "Department has staff" : "Delete"}
                        disabled={d.staff > 0}
                        onClick={() => setToDelete(d)}
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
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>
          A department that still has staff cannot be deleted.
        </p>
      </div>

      {showForm && (
        <div className="rv-overlay" onClick={() => setShowForm(false)}>
          <form className="rv-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={handleSave} noValidate>
            <h3>{editingId === null ? "Add department" : "Edit department"}</h3>
            <div className="us-field">
              <label htmlFor="dname">Department name</label>
              <input id="dname" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} />
              {error && <p className="rv-error">{error}</p>}
            </div>
            <div className="rv-actions">
              <button type="button" className="btn rv-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn" disabled={busy}>{editingId === null ? "Add" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <div className="rv-overlay" onClick={() => setToDelete(null)}>
          <div className="rv-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Delete department?</h3>
            <p>Are you sure you want to delete <b>{toDelete.name}</b>?</p>
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