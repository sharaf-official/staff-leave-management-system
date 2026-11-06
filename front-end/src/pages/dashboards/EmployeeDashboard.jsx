import { Link } from "react-router-dom";
import { FiPlusCircle, FiList } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getDb } from "../../data/db";
import { leaveBalances, leaveRequests, leaveTypeList } from "../../data/mockData";
import { DxHead, DxCard, DxStatus, DxBalances, DxCalendar } from "../../components/Dx";
import { greeting, longDate, localToday, rangeText, plural, toISO } from "../../utils/format";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const today = localToday();
  const manager = getDb().users.find((u) => u.id === user.managerId);

  const balances = leaveBalances.map((b) => {
    const total = leaveTypeList.find((t) => t.name === b.type)?.days ?? b.remaining;
    return { ...b, total, used: Math.max(total - b.remaining, 0) };
  });

  const pendingCount = leaveRequests.filter((r) => r.status === "Pending").length;
  const next = leaveRequests
    .filter((r) => (r.status === "Pending" || r.status === "Approved") && r.to >= today)
    .sort((a, b) => a.from.localeCompare(b.from))[0];

  // calendar marks: date -> status
  const marks = {};
  leaveRequests
    .filter((r) => r.status === "Approved" || r.status === "Pending")
    .forEach((r) => {
      const d = new Date(`${r.from}T00:00:00`);
      const end = new Date(`${r.to}T00:00:00`);
      while (d <= end) {
        marks[toISO(d.getFullYear(), d.getMonth(), d.getDate())] = r.status;
        d.setDate(d.getDate() + 1);
      }
    });

  const nextDate = next ? new Date(`${next.from}T00:00:00`) : null;

  return (
    <div className="dx">
      <DxHead
        eyebrow={longDate()}
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        subtitle={
          pendingCount > 0
            ? `${plural(pendingCount, "request")} waiting for approval.`
            : "You have no requests waiting for approval."
        }
        actions={[
          { to: "/apply", label: "Apply for leave", icon: <FiPlusCircle />, primary: true },
          { to: "/history", label: "My history", icon: <FiList /> },
        ]}
      />

      <div className="dx-grid">
        <div className="dx-stack">
          <DxCard title="Leave balance">
            <DxBalances balances={balances} />
          </DxCard>

          <DxCard title="Recent requests" action={{ to: "/history", label: "View all" }}>
            <div className="dx-scroll">
              <table className="dx-table">
                <thead>
                  <tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {leaveRequests.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td>{r.type}</td>
                      <td>{rangeText(r.from, r.to)}</td>
                      <td>{r.days}</td>
                      <td><DxStatus status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DxCard>
        </div>

        <div className="dx-stack">
          <DxCard title="Next leave">
            {next ? (
              <>
                <div className="dx-next">
                  <div className="dx-nextdate">
                    <b>{nextDate.getDate()}</b>
                    <span>{nextDate.toLocaleDateString("en-GB", { month: "short" })}</span>
                  </div>
                  <div>
                    <h3>{next.type} leave</h3>
                    <p className="dx-muted">{rangeText(next.from, next.to)} · {plural(next.days, "day")}</p>
                    <DxStatus status={next.status} />
                  </div>
                </div>
                {manager && (
                  <p className="dx-note">
                    Approver: <b>{manager.name}</b>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="dx-muted">Nothing planned. Plan a break when you are ready.</p>
                <Link to="/apply" className="dx-link">Apply for leave</Link>
              </>
            )}
          </DxCard>

          <DxCalendar marks={marks} />
        </div>
      </div>

    </div>
  );
}