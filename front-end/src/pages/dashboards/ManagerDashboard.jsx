import { Link } from "react-router-dom";
import { FiCheckSquare, FiPlusCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { leaveBalances, leaveTypeList, teamRequests } from "../../data/mockData";
import { DxHead, DxCard, DxMetrics, DxBalances, DxBars } from "../../components/Dx";
import { greeting, longDate, initials, plural, rangeText } from "../../utils/format";

export default function ManagerDashboard() {
  const { user } = useAuth();

  const pending = teamRequests.filter((r) => r.status === "Pending");
  const approved = teamRequests.filter((r) => r.status === "Approved").length;
  const rejected = teamRequests.filter((r) => r.status === "Rejected").length;

  const balances = leaveBalances.map((b) => {
    const total = leaveTypeList.find((t) => t.name === b.type)?.days ?? b.remaining;
    return { ...b, total, used: Math.max(total - b.remaining, 0) };
  });

  return (
    <div className="dx">
      <DxHead
        eyebrow={longDate()}
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        subtitle={
          pending.length > 0
            ? `${plural(pending.length, "team request")} waiting for your review.`
            : "You are all caught up. No team requests are waiting."
        }
        actions={[
          { to: "/approvals", label: "Review requests", icon: <FiCheckSquare />, primary: true },
          { to: "/apply", label: "Apply for leave", icon: <FiPlusCircle /> },
        ]}
      />

      <DxMetrics
        items={[
          { label: "To review", value: pending.length, hint: "Waiting for you" },
          { label: "Approved", value: approved, hint: "This period" },
          { label: "Rejected", value: rejected, hint: "This period" },
          { label: "Total requests", value: teamRequests.length, hint: "From your team" },
        ]}
      />

      <div className="dx-grid">
        <DxCard title="Waiting for your approval" action={{ to: "/approvals", label: "Open" }}>
          {pending.length === 0 ? (
            <p className="dx-muted">No pending requests.</p>
          ) : (
            <div className="dx-scroll">
              <table className="dx-table">
                <thead>
                  <tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th /></tr>
                </thead>
                <tbody>
                  {pending.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="dx-person">
                          <span className="dx-avatar">{initials(r.employee)}</span>
                          {r.employee}
                        </span>
                      </td>
                      <td>{r.type}</td>
                      <td>{rangeText(r.from, r.to)}</td>
                      <td>{r.days}</td>
                      <td className="dx-right"><Link to="/approvals" className="dx-link">Review</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DxCard>

        <div className="dx-stack">
          <DxCard title="My leave balance">
            <DxBalances balances={balances} />
          </DxCard>
          <DxCard title="Team requests">
            <DxBars
              rows={[
                { label: "Pending", value: pending.length },
                { label: "Approved", value: approved },
                { label: "Rejected", value: rejected },
              ]}
            />
          </DxCard>
        </div>
      </div>
    </div>
  );
}