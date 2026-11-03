export function Skeleton({ w = "100%", h = 16, r = 8, style }) {
  return <span className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="sk-table" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="sk-row" key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton key={j} h={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="ed" role="status" aria-label="Loading dashboard">
      <div className="sk-hero"><Skeleton h={150} r={20} /></div>
      <div className="ed-stats">
        {[0, 1, 2].map((i) => (
          <div className="ed-card" key={i}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Skeleton w={64} h={64} r={32} />
              <div style={{ flex: 1, display: "grid", gap: 8 }}>
                <Skeleton w="50%" h={12} />
                <Skeleton w="70%" h={22} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="ed-grid">
        <div className="ed-card">
          <Skeleton w="40%" h={18} style={{ marginBottom: 16 }} />
          <TableSkeleton rows={4} cols={3} />
        </div>
        <div className="ed-card">
          <Skeleton w="50%" h={18} style={{ marginBottom: 16 }} />
          <Skeleton h={180} r={14} />
        </div>
      </div>
    </div>
  );
}