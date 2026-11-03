import { Link } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";

export default function PremiumHero({ name, subtitle, actions = [], chips = [] }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateText = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <section className="ed-hero ed-anim" style={{ "--i": 0 }}>
      <span className="ed-shape s1" />
      <span className="ed-shape s2" />
      <div className="ed-hero-text">
        <p className="ed-date"><FiCalendar /> {dateText}</p>
        <h1>{greeting}, {name} 👋</h1>
        <p className="ed-sub">{subtitle}</p>
        <div className="ed-hero-actions">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className={a.primary ? "ed-btn-white" : "ed-btn-glass"}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="ed-hero-side">
        {chips.map((c) => (
          <div className="ed-chip" key={c.label}><b>{c.value}</b><span>{c.label}</span></div>
        ))}
      </div>
    </section>
  );
}