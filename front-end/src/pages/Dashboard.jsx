import { useAuth } from "../context/AuthContext";
import { leaveBalances, leaveRequests } from "../data/mockData";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="page-title">Welcome, {user.name}</h1>

      {user.role === "admin" ? (
        <div className="cards">
          <div className="card stat"><h3>24</h3><p>Total staff</p></div>
          <div className="card stat"><h3>5</h3><p>Departments</p></div>
          <div className="card stat"><h3>8</h3><p>Pending requests</p></div>
        </div>
      ) : (
        <>
          <div className="cards">
            {leaveBalances.map((b) => (
              <div className="card stat" key={b.type}>
                <h3>{b.remaining}</h3><p>{b.type} leave left</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Recent requests</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
                <tbody>
                  {leaveRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.type}</td><td>{r.from}</td><td>{r.to}</td><td>{r.days}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}