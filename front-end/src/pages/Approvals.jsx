import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiX } from "react-icons/fi";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { timeRange } from "../utils/time";

export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { leaves } = await api("/leaves");
      setRequests(leaves);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const shown = requests.filter((r) => filter === "All" || r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  const openReview = (req) => {
    setSelected(req);
    setComment("");
    setError("");
  };

  const closeReview = () => setSelected(null);

  const decide = async (status) => {
    if (busy) return;
    if (status === "Rejected" && comment.trim() === "") {
      setError("Please enter a comment when rejecting a request.");
      return;
    }
    setBusy(true);
    try {
      await api(`/leaves/${selected.id}/decision`, {
        method: "PATCH",
        body: { status: status.toLowerCase(), note: comment.trim() },
      });
      setMessage(`${selected.employee}'s request was ${status.toLowerCase()}. They were notified.`);
      setSelected(null);
      setTimeout(() => setMessage(""), 4000);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="rv-head">
          <h3 className="section-title">Team requests ({pendingCount} pending)</h3>
          <div className="rv-tabs">
            {["Pending", "Approved", "Rejected", "All"].map((f) => (
              <button
                key={f}
                className={`rv-tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {message && <div className="rv-toast">{message}</div>}
        {loadError && <div className="rv-toast" role="alert">{loadError}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Time</th><th>Days</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--muted)" }}>No requests found.</td></tr>
              )}
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee}</td>
                  <td>{r.type}</td>
                  <td>{r.from}</td>
                  <td>{r.to}</td>
                  <td>{timeRange(r)}</td>
                  <td>{r.days}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === "Pending" ? (
                      <button className="btn rv-small" onClick={() => openReview(r)}>Review</button>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>{r.comment || "-"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && createPortal(
        <div className="rv-overlay" onClick={closeReview}>
          <div className="rv-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Review leave request</h3>
            <div className="rv-info">
              <p><b>Employee:</b> {selected.employee}</p>
              <p><b>Type:</b> {selected.type} leave</p>
              <p><b>Dates:</b> {selected.from === selected.to ? selected.from : `${selected.from} to ${selected.to}`}</p>
              <p><b>Time:</b> {timeRange(selected)} ({selected.days} day{selected.days > 1 ? "s" : ""})</p>
              <p><b>Reason:</b> {selected.reason}</p>
            </div>

            <label className="rv-label" htmlFor="rv-comment">Comment (required for rejection)</label>
            <textarea
              id="rv-comment"
              rows="3"
              value={comment}
              onChange={(e) => { setComment(e.target.value); setError(""); }}
              placeholder="Write a short comment..."
            />
            {error && <p className="rv-error">{error}</p>}

            <div className="rv-actions">
              <button className="btn rv-cancel" onClick={closeReview}>Cancel</button>
              <button className="btn rv-reject" onClick={() => decide("Rejected")} disabled={busy}><FiX /> Reject</button>
              <button className="btn rv-approve" onClick={() => decide("Approved")} disabled={busy}><FiCheck /> Approve</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}