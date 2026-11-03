import { Link } from "react-router-dom";
import { FiUsers, FiBriefcase, FiInbox, FiCalendar, FiUserPlus, FiBarChart2, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { reportData, staffList, departments } from "../../data/mockData";
import PremiumHero from "../../components/PremiumHero";
import EdStat from "../../components/EdStat";
import EdBar from "../../components/EdBar";
import StatusBadge from "../../components/StatusBadge";

const typeColors = {
  Annual: "linear-gradient(90deg,#4f46e5,#8b5cf6)",
  Sick: "linear-gradient(90deg,#ec4899,#f472b6)",
  Casual: "linear-gradient(90deg,#10b981,#34d399)",
};
const deptColor = "linear-gradient(90deg,#0ea5e9,#38bdf8)";

const initials = (name) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");
const prettyDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function AdminDashboard() {
  const { user } = useAuth();

  const pending = reportData.filter((r) => r.status === "Pending").length;
  const approvedDays = reportData.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);

  const byType = ["Annual", "Sick", "Casual"].map((t) => ({
    label: t,
    value: reportData.filter((r) => r.type === t).length,
  }));
  const maxType = Math.max(...byType.map((b) => b.value), 1);

  const byDept = departments.map((d) => ({
    label: d,
    value: staffList.filter((s) => s.department === d).length,
  }));
  const maxDept = Math.max(...byDept.map((b) => b.value), 1);

  return (
    <div className="ed">
      <PremiumHero
        name={user.name.split(" ")[0]}
        subtitle="Manage staff, departments and leave policies from one place."
        actions={[
          { to: "/users", label: "Manage users", icon: <FiUserPlus />, primary: true },
          { to: "/reports", label: "View reports", icon: <FiBarChart2 /> },
        ]}
        chips={[
          { value: staffList.length, label: "Staff" },
          { value: pending, label: "Pending" },
        ]}
      />

      <section className="ed-stats">
        <EdStat index={0} icon={<FiUsers />} color="#4f46e5" soft="#eef2ff" value={staffList.length} label="Total staff" />
        <EdStat index={1} icon={<FiBriefcase />} color="#0ea5e9" soft="#f0f9ff" value={departments.length} label="Departments" />
        <EdStat index={2} icon={<FiInbox />} color="#d97706" soft="#fef3c7" value={pending} label="Pending requests" />
        <EdStat index={3} icon={<FiCalendar />} color="#10b981" soft="#ecfdf5" value={approvedDays} label="Approved leave days" />
      </section>

      <section className="ed-grid">
        <div className="ed-card ed-anim" style={{ "--i": 5 }}>
          <div className="ed-card-head">
            <h3>Recent leave requests</h3>
            <Link to="/reports" className="ed-link">View all <FiArrowRight /></Link>
          </div>
          <div className="ed-list">
            {reportData.slice(0, 5).map((r) => (
              <div className="ed-item" key={r.id}>
                <span className="ed-avatar">{initials(r.employee)}</span>
                <div className="ed-item-body">
                  <b>{r.employee}</b>
                  <span>{r.department} · {r.type} · {prettyDate(r.from)}</span>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="ed-col">
          <div className="ed-card ed-anim" style={{ "--i": 6 }}>
            <div className="ed-card-head"><h3>Leave by type</h3></div>
            {byType.map((b) => (
              <EdBar key={b.label} label={b.label} value={b.value} max={maxType} color={typeColors[b.label]} />
            ))}
          </div>

          <div className="ed-card ed-anim" style={{ "--i": 7 }}>
            <div className="ed-card-head"><h3>Staff by department</h3></div>
            {byDept.map((b) => (
              <EdBar key={b.label} label={b.label} value={b.value} max={maxDept} color={deptColor} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}