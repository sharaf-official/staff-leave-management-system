import { FiUsers, FiBriefcase, FiUserCheck, FiClock } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { allRequests, leaveByType } from "../../data/mockData";
import StatCard from "../../components/StatCard";
import DashboardBanner from "../../components/DashboardBanner";
import StatusBadge from "../../components/StatusBadge";

export default function AdminDashboard() {
  const { user } = useAuth();
  const pending = allRequests.filter((r) => r.status === "Pending").length;
  const max = Math.max(...leaveByType.map((l) => l.count));

  return (
    <div>
      <DashboardBanner
        name={user.name.split(" ")[0]}
        subtitle="Manage staff, departments and leave policies from here."
        actions={[
          { to: "/users", label: "Manage users", primary: true },
          { to: "/reports", label: "View reports" },
        ]}
      />

      <div className="cards cards-4">
        <StatCard icon={<FiUsers />} color="icon-blue" value={24} label="Total staff" />
        <StatCard icon={<FiBriefcase />} color="icon-green" value={5} label="Departments" />
        <StatCard icon={<FiUserCheck />} color="icon-pink" value={3} label="On leave today" />
        <StatCard icon={<FiClock />} color="icon-amber" value={pending} label="Pending requests" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Recent leave requests</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Type</th><th>From</th><th>Status</th></tr></thead>
              <tbody>
                {allRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employee}</td><td>{r.department}</td><td>{r.type}</td><td>{r.from}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Leave by type (this month)</h3>
          {leaveByType.map((l) => (
            <div className="bar-row" key={l.type}>
              <span className="bar-label">{l.type}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(l.count / max) * 100}%` }} />
              </div>
              <span className="bar-count">{l.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}