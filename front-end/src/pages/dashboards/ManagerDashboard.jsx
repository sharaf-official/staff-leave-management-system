import { FiSun, FiHeart, FiCoffee, FiCheckSquare } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { leaveBalances, teamRequests } from "../../data/mockData";
import StatCard from "../../components/StatCard";
import DashboardBanner from "../../components/DashboardBanner";
import StatusBadge from "../../components/StatusBadge";

const style = {
  Annual: { icon: <FiSun />, color: "icon-blue" },
  Sick: { icon: <FiHeart />, color: "icon-pink" },
  Casual: { icon: <FiCoffee />, color: "icon-green" },
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const pending = teamRequests.filter((r) => r.status === "Pending").length;

  return (
    <div>
      <DashboardBanner
        name={user.name.split(" ")[0]}
        subtitle="Your leave balance and your team's requests at a glance."
        actions={[
          { to: "/approvals", label: "Review team requests", primary: true },
          { to: "/apply", label: "Apply for leave" },
        ]}
      />

      <div className="cards cards-4">
        {leaveBalances.map((b) => (
          <StatCard key={b.type} icon={style[b.type].icon} color={style[b.type].color}
                    value={b.remaining} label={`My ${b.type.toLowerCase()} leave left`} />
        ))}
        <StatCard icon={<FiCheckSquare />} color="icon-amber" value={pending} label="Team requests pending" />
      </div>

      <div className="card">
        <h3 className="section-title">Team requests</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Status</th></tr></thead>
            <tbody>
              {teamRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee}</td><td>{r.type}</td><td>{r.from}</td><td>{r.to}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}