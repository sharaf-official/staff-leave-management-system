export default function EdBar({ label, value, max, color }) {
  return (
    <div className="ed-bar-row">
      <span className="ed-bar-label">{label}</span>
      <div className="ed-bar-track">
        <div className="ed-bar-fill" style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} />
      </div>
      <span className="ed-bar-count">{value}</span>
    </div>
  );
}