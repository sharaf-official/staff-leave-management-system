import { Link } from "react-router-dom";
import { FiSun, FiHeart, FiCoffee, FiInbox, FiCheckSquare, FiPlusCircle, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { leaveBalances, teamRequests } from "../../data/mockData";
import PremiumHero from "../../components/PremiumHero";
import EdStat from "../../components/EdStat";
import EdBar from "../../components/EdBar";
import StatusBadge from "../../components/StatusBadge";

const typeStyle = {
  Annual: { icon: <FiSun />, color: "#4f46e5", soft: "#eef2ff" },
  Sick: { icon: <FiHeart />, color: "#ec4899", soft: "#fdf2f8" },
  Casual: { icon: <FiCoffee />, color: "#10b981", soft: "#ecfdf5" },
};

const initials = (name) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");
const prettyDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function ManagerDashboard() {
  const { user } = useAuth();

  const pending = teamRequests.filter((r) => r.status === "Pending");
  const approved = teamRequests.filter((r) => r.status === "Approved").length;
  const rejected = teamRequests.filter((r) => r.status === "Rejected").length;
  const max = Math.max(pending.length, approved, rejected, 1);

  return (
    <div className="ed">
      <PremiumHero
        name={user.name.split(" ")[0]}
        subtitle={
          pending.length > 0
            ? `${pending.length} team request${pending.length > 1 ? "s are" : " is"} waiting for your review.`
            : "All caught up. No team requests are waiting."
        }
        actions={[
          { to: "/approvals", label: "Review requests", icon: <FiCheckSquare />, primary: true },
          { to: "/apply", label: "Apply for leave", icon: <FiPlusCircle /> },
        ]}
        chips={[
          { value: pending.length, label: "To review" },
          { value: approved, label: "Approved" },
        ]}
      />

      {/* Stats: my balances + team pending */}
      <section className="ed-stats">
        {leaveBalances.map((b, i) => {
          const s = typeStyle[b.type];
          return (
            <EdStat key={b.type} index={i} icon={s.icon} color={s.color} soft={s.soft}
                    value={b.remaining} label={`My ${b.type.toLowerCase()} leave left`} />
          );
        })}
        <EdStat index={3} icon={<FiInbox />} color="#d97706" soft="#fef3c7" value={pending.length} label="Team requests pending" />
      </section>

      <section className="ed-grid">
        {/* Pending approvals */}
        <div className="ed-card ed-anim" style={{ "--i": 5 }}>
          <div className="ed-card-head">
            <h3>Waiting for your approval</h3>
            <Link to="/approvals" className="ed-link">Open <FiArrowRight /></Link>
          </div>
          {pending.length === 0 ? (
            <p className="ed-empty"><FiCheckCircle /> No pending requests.</p>
          ) : (
            <div className="ed-list">
              {pending.map((r) => (
                <Link to="/approvals" className="ed-item ed-item-link" key={r.id}>
                  <span className="ed-avatar">{initials(r.employee)}</span>
                  <div className="ed-item-body">
                    <b>{r.employee}</b>
                    <span>
                      {r.type} · {prettyDate(r.from)}{r.from !== r.to ? ` - ${prettyDate(r.to)}` : ""} · {r.days} day{r.days > 1 ? "s" : ""}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="ed-card ed-anim" style={{ "--i": 6 }}>
          <div className="ed-card-head"><h3>Team requests overview</h3></div>
          <EdBar label="Pending" value={pending.length} max={max} color="linear-gradient(90deg,#f59e0b,#fbbf24)" />
          <EdBar label="Approved" value={approved} max={max} color="linear-gradient(90deg,#16a34a,#4ade80)" />
          <EdBar label="Rejected" value={rejected} max={max} color="linear-gradient(90deg,#dc2626,#f87171)" />
          <p className="ed-muted" style={{ marginTop: 14 }}>
            Total requests this period: <b>{teamRequests.length}</b>
          </p>
        </div>
      </section>
    </div>
  );
}