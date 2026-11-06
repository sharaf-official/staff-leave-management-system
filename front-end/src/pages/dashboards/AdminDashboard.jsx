import { FiUserPlus, FiBarChart2 } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getCompany, getDb } from "../../data/db";
import { reportData } from "../../data/mockData";
import { DxHead, DxCard, DxMetrics, DxStatus, DxBars } from "../../components/Dx";
import { greeting, initials, rangeText } from "../../utils/format";

export default function AdminDashboard() {
  const { user } = useAuth();
  const company = getCompany(user.companyId);
  const people = getDb().users.filter((u) => u.companyId === user.companyId);

  const invited = people.filter((p) => p.status === "invited").length;
  const pending = reportData.filter((r) => r.status === "Pending").length;
  const approvedDays = reportData.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);

  const byType = ["Annual", "Sick", "Casual"].map((t) => ({
    label: t,
    value: reportData.filter((r) => r.type === t).length,
  }));

  const deptNames = [...new Set(people.map((p) => p.department).filter(Boolean))];
  const byDept = deptNames
    .map((d) => ({ label: d, value: people.filter((p) => p.department === d).length }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="dx">
      <DxHead
        eyebrow={company ? company.name : "Company overview"}
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        subtitle="Staff, departments and leave activity at a glance."
        actions={[
          { to: "/users", label: "Add employee", icon: <FiUserPlus />, primary: true },
          { to: "/reports", label: "View reports", icon: <FiBarChart2 /> },
        ]}
      />

      <DxMetrics
        items={[
          { label: "Total staff", value: people.length, hint: `${deptNames.length} departments` },
          { label: "Invitations pending", value: invited, hint: "Not signed in yet" },
          { label: "Pending requests", value: pending, hint: "Across the company" },
          { label: "Approved leave days", value: approvedDays, hint: "This year" },
        ]}
      />

      <div className="dx-grid">
        <DxCard title="Recent leave requests" action={{ to: "/reports", label: "View all" }}>
          <div className="dx-scroll">
            <table className="dx-table">
              <thead>
                <tr><th>Employee</th><th>Department</th><th>Type</th><th>Dates</th><th>Status</th></tr>
              </thead>
              <tbody>
                {reportData.slice(0, 6).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="dx-person">
                        <span className="dx-avatar">{initials(r.employee)}</span>
                        {r.employee}
                      </span>
                    </td>
                    <td>{r.department}</td>
                    <td>{r.type}</td>
                    <td>{rangeText(r.from, r.to)}</td>
                    <td><DxStatus status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DxCard>

        <div className="dx-stack">
          <DxCard title="Leave by type">
            <DxBars rows={byType} />
          </DxCard>
          <DxCard title="Staff by department">
            <DxBars rows={byDept} />
          </DxCard>
        </div>
      </div>
    </div>
  );
}