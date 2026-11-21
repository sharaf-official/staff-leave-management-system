import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Holidays() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", date: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { holidays } = await api("/holidays");
      setItems(holidays);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 2) return setError("Enter the holiday name.");
    if (!form.date) return setError("Choose a date.");
    setBusy(true);
    try {
      await api("/holidays", { method: "POST", body: { name: form.name, date: form.date } });
      setForm({ name: "", date: "" });
      flash("Holiday added. Leave day calculation will skip this date.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (h) => {
    if (!window.confirm(`Delete "${h.name}" (${h.date})?`)) return;
    try {
      await api(`/holidays/${h.id}`, { method: "DELETE" });
      flash("Holiday deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {isAdmin && (
        <div className="card">
          <h3 className="section-title">Add a company holiday</h3>
          <form className="an-form" onSubmit={handleAdd} noValidate>
            <div className="us-field">
              <label htmlFor="hname">Holiday name</label>
              <input id="hname" name="name" value={form.name} onChange={handleChange} maxLength={100} placeholder="e.g. Poya Day" />
            </div>
            <div className="us-field">
              <label htmlFor="hdate">Date</label>
              <input id="hdate" name="date" type="date" value={form.date} onChange={handleChange} />
            </div>
            {error && <p className="rv-error">{error}</p>}
            {message && <div className="rv-toast">{message}</div>}
            <div className="rp-bar">
              <button type="submit" className="btn us-add" disabled={busy}>
                <FiPlus /> Add holiday
              </button>
            </div>
          </form>
        </div>
      )}

      {!isAdmin && error && <p className="rv-error">{error}</p>}

      <div className="card">
        <h3 className="section-title">Holidays ({items.length})</h3>
        <p style={{ color: "var(--muted)" }}>Holidays are not counted as leave days when you apply.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Holiday</th>{isAdmin && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={isAdmin ? 3 : 2} style={{ textAlign: "center", color: "var(--muted)" }}>No holidays added yet.</td></tr>
              )}
              {items.map((h) => (
                <tr key={h.id}>
                  <td>{h.date}</td>
                  <td>{h.name}</td>
                  {isAdmin && (
                    <td>
                      <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(h)}><FiTrash2 /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}