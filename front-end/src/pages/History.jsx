import { useState } from "react";
import { leaveRequests } from "../data/mockData";
import StatusBadge from "../components/StatusBadge";

export default function History() {
  const [requests, setRequests] = useState(leaveRequests);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");

  const filtered = requests.filter(
    (r) => (!status || r.status === status) && (!type || r.type === type)
  );

  const handleCancel = (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: "Cancelled" } : r)));
    setMessage("Leave request cancelled");
  };

  return (
    <div>
      <h1 className="page-title">My Leave History</h1>
      <div className="card">
        {message && <div className="alert alert-success">{message}</div>}

        <div className="filters">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Cancelled</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All leave types</option>
            <option>Annual</option>
            <option>Sick</option>
            <option>Casual</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7">No leave requests found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.type}</td>
                    <td>{r.from}</td>
                    <td>{r.to}</td>
                    <td>{r.days}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {r.status === "Pending" ? (
                        <button className="btn btn-sm btn-danger" onClick={() => handleCancel(r.id)}>Cancel</button>
                      ) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}