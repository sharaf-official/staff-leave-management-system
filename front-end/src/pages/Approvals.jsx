import { useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { teamRequests } from "../data/mockData";
import StatusBadge from "../components/StatusBadge";

export default function Approvals() {
  const [requests, setRequests] = useState(teamRequests);
  const [filter, setFilter] = useState("Pending");
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const shown = requests.filter((r) => filter === "All" || r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  const openReview = (req) => {
    setSelected(req);
    setComment("");
    setError("");
  };

  const closeReview = () => setSelected(null);

  const decide = (status) => {
    if (status === "Rejected" && comment.trim() === "") {
      setError("Please enter a comment when rejecting a request.");
      return;
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === selected.id ? { ...r, status, comment: comment.trim() } : r))
    );
    setMessage(`${selected.employee}'s request was ${status.toLowerCase()}.`);
    setSelected(null);
    setTimeout(() => setMessage(""), 3500);
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

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--muted)" }}>No requests found.</td></tr>
              )}
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee}</td>
                  <td>{r.type}</td>
                  <td>{r.from}</td>
                  <td>{r.to}</td>
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

      {selected && (
        <div className="rv-overlay" onClick={closeReview}>
          <div className="rv-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Review leave request</h3>
            <div className="rv-info">
              <p><b>Employee:</b> {selected.employee}</p>
              <p><b>Type:</b> {selected.type} leave</p>
              <p><b>Dates:</b> {selected.from} to {selected.to} ({selected.days} day{selected.days > 1 ? "s" : ""})</p>
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
              <button className="btn rv-reject" onClick={() => decide("Rejected")}><FiX /> Reject</button>
              <button className="btn rv-approve" onClick={() => decide("Approved")}><FiCheck /> Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}