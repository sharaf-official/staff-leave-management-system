import { Link } from "react-router-dom";

export default function DashboardBanner({ name, subtitle, actions }) {
  return (
    <div className="banner">
      <div className="banner-row">
        <div>
          <h1>Welcome back, {name} 👋</h1>
          <p>{subtitle}</p>
        </div>
        <div className="banner-actions">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className={`btn ${a.primary ? "btn-light" : "btn-ghost"}`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}