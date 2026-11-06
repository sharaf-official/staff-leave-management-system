import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { MONTHS, toISO, localToday } from "../utils/format";

/* Page header: small eyebrow, title, one line of context, actions on the right */
export function DxHead({ eyebrow, title, subtitle, actions = [] }) {
  return (
    <header className="dx-head">
      <div>
        {eyebrow && <p className="dx-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="dx-sub">{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="dx-actions">
          {actions.map((a) => (
            <Link key={a.to + a.label} to={a.to} className={`dx-btn ${a.primary ? "primary" : ""}`}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function DxCard({ title, action, children, className = "" }) {
  return (
    <section className={`dx-card ${className}`}>
      {(title || action) && (
        <div className="dx-card-head">
          <h2>{title}</h2>
          {action && (
            <Link to={action.to} className="dx-link">
              {action.label} <FiArrowRight />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/* Status is a coloured dot + word, not a pill */
export function DxStatus({ status }) {
  return (
    <span className={`dx-status s-${status.toLowerCase()}`}>
      <i /> {status}
    </span>
  );
}

/* One card split into columns by thin lines */
export function DxMetrics({ items }) {
  return (
    <section className="dx-metrics">
      {items.map((m) => (
        <div className="dx-metric" key={m.label}>
          <span>{m.label}</span>
          <b>{m.value}</b>
          {m.hint && <small>{m.hint}</small>}
        </div>
      ))}
    </section>
  );
}

/* Leave balance rows with a thin progress bar */
export function DxBalances({ balances }) {
  return (
    <div className="dx-bal">
      {balances.map((b) => {
        const low = b.total > 0 && b.remaining / b.total <= 0.25;
        return (
          <div className="dx-bal-row" key={b.type}>
            <div className="dx-bal-top">
              <span>{b.type} leave</span>
              <b>
                {b.remaining}
                <small> / {b.total} days</small>
              </b>
            </div>
            <div className="dx-track" role="img" aria-label={`${b.remaining} of ${b.total} days remaining`}>
              <i className={low ? "low" : ""} style={{ width: `${b.total ? (b.remaining / b.total) * 100 : 0}%` }} />
            </div>
            <small className="dx-muted">{b.used} used</small>
          </div>
        );
      })}
    </div>
  );
}

/* Horizontal bars: label, bar, value */
export function DxBars({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="dx-bars">
      {rows.map((r) => (
        <div className="dx-hbar" key={r.label}>
          <span>{r.label}</span>
          <div className="dx-track"><i style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <b>{r.value}</b>
        </div>
      ))}
    </div>
  );
}

/* Compact month view: leave days get a small dot, today is outlined */
export function DxCalendar({ marks }) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = localToday();

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const move = (delta) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <section className="dx-card">
      <div className="dx-card-head">
        <h2>{MONTHS[view.m]} {view.y}</h2>
        <div className="dx-nav">
          <button type="button" onClick={() => move(-1)} aria-label="Previous month"><FiChevronLeft /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next month"><FiChevronRight /></button>
        </div>
      </div>
      <div className="dx-cal">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="dx-cal-h">{d}</span>)}
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const iso = toISO(view.y, view.m, d);
          const status = marks[iso];
          const cls = ["dx-day", status && status.toLowerCase(), iso === today && "today"].filter(Boolean).join(" ");
          return <span key={i} className={cls}>{d}</span>;
        })}
      </div>
      <div className="dx-legend">
        <span><i className="approved" /> Approved</span>
        <span><i className="pending" /> Pending</span>
      </div>
    </section>
  );
}