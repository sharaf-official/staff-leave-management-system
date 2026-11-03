import { useState } from "react";
import { Link } from "react-router-dom";
import {FiSun, FiHeart, FiCoffee, FiPlusCircle, FiChevronLeft,FiChevronRight, FiCalendar, FiArrowRight, FiCheckCircle, FiList,} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { leaveBalances, leaveRequests, leaveTypeList } from "../../data/mockData";
import StatusBadge from "../../components/StatusBadge";

const typeStyle = {
  Annual: { icon: <FiSun />, color: "#4f46e5", soft: "#eef2ff" },
  Sick: { icon: <FiHeart />, color: "#ec4899", soft: "#fdf2f8" },
  Casual: { icon: <FiCoffee />, color: "#10b981", soft: "#ecfdf5" },
};
const fallbackStyle = { icon: <FiCalendar />, color: "#0ea5e9", soft: "#f0f9ff" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const pad = (n) => String(n).padStart(2, "0");
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const localToday = () => {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
};
const prettyDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function Ring({ percent, color }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="ed-ring">
      <circle cx="42" cy="42" r={r} className="ed-ring-bg" />
      <circle
        cx="42" cy="42" r={r}
        className="ed-ring-fg"
        transform="rotate(-90 42 42)"
        style={{ stroke: color, strokeDasharray: c, strokeDashoffset: c * (1 - percent / 100), "--c": c }}
      />
    </svg>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const today = localToday();
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateText = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // balances with total entitlement
  const balances = leaveBalances.map((b) => {
    const total = leaveTypeList.find((t) => t.name === b.type)?.days ?? b.remaining;
    const used = Math.max(total - b.remaining, 0);
    return { ...b, total, used, percent: total ? Math.round((b.remaining / total) * 100) : 0 };
  });

  // stats
  const pendingCount = leaveRequests.filter((r) => r.status === "Pending").length;
  const approvedDays = leaveRequests.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);

  // upcoming
  const upcoming = leaveRequests
    .filter((r) => (r.status === "Pending" || r.status === "Approved") && r.to >= today)
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(0, 3);
  const next = upcoming[0];

  // calendar marks: date -> status
  const marks = {};
  leaveRequests
    .filter((r) => r.status === "Approved" || r.status === "Pending")
    .forEach((r) => {
      const d = new Date(r.from + "T00:00:00");
      const end = new Date(r.to + "T00:00:00");
      while (d <= end) {
        marks[toISO(d.getFullYear(), d.getMonth(), d.getDate())] = r.status;
        d.setDate(d.getDate() + 1);
      }
    });

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const changeMonth = (delta) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="ed">
      {/* HERO */}
      <section className="ed-hero ed-anim" style={{ "--i": 0 }}>
        <span className="ed-shape s1" />
        <span className="ed-shape s2" />
        <div className="ed-hero-text">
          <p className="ed-date"><FiCalendar /> {dateText}</p>
          <h1>{greeting}, {user.name.split(" ")[0]} 👋</h1>
          <p className="ed-sub">
            {next
              ? `Your next leave starts on ${prettyDate(next.from)} (${next.type}, ${next.days} day${next.days > 1 ? "s" : ""}).`
              : "You have no upcoming leave. Plan a break when you are ready."}
          </p>
          <div className="ed-hero-actions">
            <Link to="/apply" className="ed-btn-white"><FiPlusCircle /> Apply for leave</Link>
            <Link to="/history" className="ed-btn-glass"><FiList /> My history</Link>
          </div>
        </div>
        <div className="ed-hero-side">
          <div className="ed-chip"><b>{pendingCount}</b><span>Pending</span></div>
          <div className="ed-chip"><b>{approvedDays}</b><span>Days taken</span></div>
        </div>
      </section>

      {/* BALANCES */}
      <section className="ed-balances">
        {balances.map((b, i) => {
          const s = typeStyle[b.type] || fallbackStyle;
          return (
            <div className="ed-card ed-balance ed-anim" style={{ "--i": i + 1 }} key={b.type}>
              <div className="ed-ring-wrap">
                <Ring percent={b.percent} color={s.color} />
                <span className="ed-ring-icon" style={{ color: s.color, background: s.soft }}>{s.icon}</span>
              </div>
              <div>
                <p className="ed-label">{b.type} leave</p>
                <h3><span style={{ color: s.color }}>{b.remaining}</span> <small>/ {b.total} days left</small></h3>
                <p className="ed-muted">{b.used} day{b.used !== 1 ? "s" : ""} used</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* MAIN GRID */}
      <section className="ed-grid">
        <div className="ed-col">
          {/* Recent requests */}
          <div className="ed-card ed-anim" style={{ "--i": 4 }}>
            <div className="ed-card-head">
              <h3>Recent requests</h3>
              <Link to="/history" className="ed-link">View all <FiArrowRight /></Link>
            </div>
            <div className="ed-list">
              {leaveRequests.slice(0, 4).map((r) => {
                const s = typeStyle[r.type] || fallbackStyle;
                return (
                  <div className="ed-item" key={r.id}>
                    <span className="ed-item-icon" style={{ color: s.color, background: s.soft }}>{s.icon}</span>
                    <div className="ed-item-body">
                      <b>{r.type} leave</b>
                      <span>
                        {prettyDate(r.from)}{r.from !== r.to ? ` - ${prettyDate(r.to)}` : ""} · {r.days} day{r.days > 1 ? "s" : ""}
                      </span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming */}
          <div className="ed-card ed-anim" style={{ "--i": 5 }}>
            <div className="ed-card-head"><h3>Upcoming leave</h3></div>
            {upcoming.length === 0 ? (
              <p className="ed-empty"><FiCheckCircle /> Nothing planned yet.</p>
            ) : (
              <div className="ed-list">
                {upcoming.map((r) => (
                  <div className="ed-item" key={r.id}>
                    <span className="ed-date-box">
                      <b>{new Date(r.from + "T00:00:00").getDate()}</b>
                      <small>{MONTHS[new Date(r.from + "T00:00:00").getMonth()].slice(0, 3)}</small>
                    </span>
                    <div className="ed-item-body">
                      <b>{r.type} leave</b>
                      <span>{r.days} day{r.days > 1 ? "s" : ""}</span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="ed-card ed-anim" style={{ "--i": 6 }}>
          <div className="ed-card-head">
            <h3>{MONTHS[view.m]} {view.y}</h3>
            <div className="ed-nav">
              <button onClick={() => changeMonth(-1)} aria-label="Previous month"><FiChevronLeft /></button>
              <button onClick={() => changeMonth(1)} aria-label="Next month"><FiChevronRight /></button>
            </div>
          </div>
          <div className="ed-cal">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="ed-cal-h">{d}</span>)}
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const iso = toISO(view.y, view.m, d);
              const status = marks[iso];
              const cls = ["ed-day", status === "Approved" && "approved", status === "Pending" && "pending", iso === today && "today"]
                .filter(Boolean).join(" ");
              return <span key={i} className={cls}>{d}</span>;
            })}
          </div>
          <div className="ed-legend">
            <span><i className="approved" /> Approved</span>
            <span><i className="pending" /> Pending</span>
            <span><i className="today" /> Today</span>
          </div>
        </div>
      </section>
    </div>
  );
}