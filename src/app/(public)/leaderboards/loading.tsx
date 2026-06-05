export default function LeaderboardsLoading() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="screen-header">
        <div className="skeleton" style={{ height: 28, width: 180, borderRadius: 6 }} />
      </div>
      <div style={{ padding: "16px 18px 100px" }}>
        {/* Tab skeleton */}
        <div className="skeleton" style={{ height: 50, borderRadius: 14, marginBottom: 16 }} />
        {/* Row skeletons */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "13px 16px", borderBottom: i < 4 ? "1px solid var(--line)" : "none", opacity: 1 - i * 0.12 }}>
              <div className="skeleton" style={{ width: 26, height: 22, borderRadius: 4, flexShrink: 0 }} />
              <div className="skeleton" style={{ height: 14, flex: 1, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 22, width: 50, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
