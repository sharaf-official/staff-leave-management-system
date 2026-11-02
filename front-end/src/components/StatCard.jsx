export default function StatCard({ icon, color, value, label }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}