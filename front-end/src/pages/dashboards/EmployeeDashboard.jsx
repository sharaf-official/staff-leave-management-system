import { FiSun, FiHeart, FiCoffee, FiClock } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { leaveBalances, leaveRequests } from "../../data/mockData";
import StatCard from "../../components/StatCard";
import DashboardBanner from "../../components/DashboardBanner";
import StatusBadge from "../../components/StatusBadge";

const style = {
  Annual: { icon: <FiSun />, color: "icon-blue" },
  Sick: { icon: <FiHeart />, color: "icon-pink" },
  Casual: { icon: <FiCoffee />, color: "icon-green" },
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const pending = leaveRequests.filter((r) => r.status === "Pending").length;

  return (
    <div>
      <DashboardBanner
        name={user.name.split(" ")[0]}
        subtitle="Here is a quick overview of your leave."
        actions={[
          { to: "/apply", label: "Apply for leave", primary: true },
          { to: "/history", label: "View history" },
        ]}
      />

      <div className="cards cards-4">
        {leaveBalances.map((b) => (
          <StatCard key={b.type} icon={style[b.type].icon} color={style[b.type].color}
                    value={b.remaining} label={`${b.type} leave left`} />
        ))}
        <StatCard icon={<FiClock />} color="icon-amber" value={pending} label="Pending requests" />
      </div>

      <div className="card">
        <h3 className="section-title">My recent requests</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
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
    </div>
  );
}