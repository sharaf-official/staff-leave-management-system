import { useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { departments as deptNames, staffList } from "../data/mockData";

export default function Departments() {
  const [depts, setDepts] = useState(deptNames.map((name, i) => ({ id: i + 1, name })));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [message, setMessage] = useState("");

  const staffCount = (deptName) => staffList.filter((s) => s.department === deptName).length;

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const openAdd = () => { setName(""); setEditingId(null); setError(""); setShowForm(true); };
  const openEdit = (d) => { setName(d.name); setEditingId(d.id); setError(""); setShowForm(true); };

  const handleSave = (e) => {
    e.preventDefault();
    const value = name.trim();
    if (value.length < 2) return setError("Department name must be at least 2 characters.");
    if (depts.some((d) => d.name.toLowerCase() === value.toLowerCase() && d.id !== editingId))
      return setError("This department already exists.");

    if (editingId === null) {
      setDepts([...depts, { id: Date.now(), name: value }]);
      flash("Department added.");
    } else {
      setDepts(depts.map((d) => (d.id === editingId ? { ...d, name: value } : d)));
      flash("Department updated.");
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    setDepts(depts.filter((d) => d.id !== toDelete.id));
    flash(`${toDelete.name} department deleted.`);
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
                  <td>{staffCount(d.name)}</td>
                  <td>
                    <div className="us-actions">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(d)}><FiEdit2 /></button>
                      <button
                        className="icon-btn danger"
                        title={staffCount(d.name) > 0 ? "Department has staff" : "Delete"}
                        disabled={staffCount(d.name) > 0}
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
              <button type="submit" className="btn">{editingId === null ? "Add" : "Save changes"}</button>
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