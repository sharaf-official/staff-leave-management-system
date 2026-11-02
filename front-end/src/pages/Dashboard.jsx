import { FiSun, FiHeart, FiCoffee, FiUsers, FiBriefcase, FiClock } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { leaveBalances, leaveRequests } from "../data/mockData";
import StatusBadge from "../components/StatusBadge";

const balanceStyle = {
  Annual: { icon: <FiSun />, color: "icon-blue" },
  Sick: { icon: <FiHeart />, color: "icon-pink" },
  Casual: { icon: <FiCoffee />, color: "icon-green" },
};

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
   <div className="banner">
  <h1>Welcome back, {user.name.split(" ")[0]} 👋</h1>
  <p>Here is a quick overview of your leave.</p>
</div>
      {user.role === "admin" ? (
        <div className="cards">
          <div className="card stat-card">
            <div className="stat-icon icon-blue"><FiUsers /></div>
            <div><h3>24</h3><p>Total staff</p></div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon icon-green"><FiBriefcase /></div>
            <div><h3>5</h3><p>Departments</p></div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon icon-amber"><FiClock /></div>
            <div><h3>8</h3><p>Pending requests</p></div>
          </div>
        </div>
      ) : (
        <>
          <div className="cards">
            {leaveBalances.map((b) => (
              <div className="card stat-card" key={b.type}>
                <div className={`stat-icon ${balanceStyle[b.type].color}`}>{balanceStyle[b.type].icon}</div>
                <div><h3>{b.remaining}</h3><p>{b.type} leave left</p></div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="section-title">Recent requests</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {leaveRequests.slice(0, 4).map((r) => (
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