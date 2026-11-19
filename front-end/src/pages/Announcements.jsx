import { useCallback, useEffect, useState } from "react";
import { FiSend } from "react-icons/fi";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const emptyForm = { title: "", message: "" };

export default function Announcements() {
  const { user } = useAuth();
  const canPost = user.role === "admin" || user.role === "manager";
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const { announcements } = await api("/announcements");
      setItems(announcements);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (form.title.trim().length < 3) return setError("Title must be at least 3 characters.");
    if (form.message.trim().length < 5) return setError("Message must be at least 5 characters.");

    setBusy(true);
    try {
      await api("/announcements", { method: "POST", body: { title: form.title, message: form.message } });
      setForm(emptyForm);
      setMessage("Announcement posted. Everyone has been notified.");
      setTimeout(() => setMessage(""), 3000);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {canPost && (
        <div className="card">
          <h3 className="section-title">Post an announcement</h3>
          <form className="an-form" onSubmit={handlePost} noValidate>
            <div className="us-field">
              <label htmlFor="atitle">Title</label>
              <input id="atitle" name="title" value={form.title} onChange={handleChange} maxLength={150} />
            </div>
            <div className="us-field">
              <label htmlFor="amsg">Message</label>
              <textarea id="amsg" name="message" rows="4" value={form.message} onChange={handleChange} maxLength={2000} />
            </div>
            {error && <p className="rv-error">{error}</p>}
            {message && <div className="rv-toast">{message}</div>}
            <div className="rp-bar">
              <button type="submit" className="btn us-add" disabled={busy}>
                <FiSend /> Post and notify everyone
              </button>
            </div>
          </form>
        </div>
      )}

      {!canPost && error && <p className="rv-error">{error}</p>}

      <div className="card">
        <h3 className="section-title">Announcements ({items.length})</h3>
        {items.length === 0 && <p style={{ color: "var(--muted)" }}>No announcements yet.</p>}
        <div className="an-list">
          {items.map((a) => (
            <div key={a.id} className="an-item">
              <div className="an-avatar">{a.author.charAt(0).toUpperCase()}</div>
              <div className="an-body">
                <div className="an-top">
                  <h4 className="an-title">{a.title}</h4>
                  <span className={`an-badge ${a.authorRole}`}>{a.authorRole}</span>
                  {now - new Date(a.created_at).getTime() < 24 * 60 * 60 * 1000 && (                    <span className="an-new">New</span>
                  )}
                </div>
                <p className="an-text">{a.message}</p>
                <div className="an-meta">
                  Posted by {a.author} · {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}