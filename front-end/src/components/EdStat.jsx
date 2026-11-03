export default function EdStat({ icon, color, soft, value, label, index = 0 }) {
  return (
    <div className="ed-card ed-stat ed-anim" style={{ "--i": index + 1 }}>
      <span className="ed-stat-icon" style={{ color, background: soft }}>{icon}</span>
      <div>
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}