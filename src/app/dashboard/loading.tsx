export default function DashboardLoading() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Greeting skeleton */}
      <div style={{ padding: "58px 18px 16px", background: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 18 }}>
          <div className="skeleton" style={{ width: 50, height: 50, borderRadius: "50%" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="skeleton" style={{ height: 13, width: 80, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 22, width: 140, borderRadius: 4 }} />
          </div>
        </div>
      </div>
      <div className="dash-content">
        {/* Stats */}
        <div className="stats-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card stat-tile">
              <div className="skeleton" style={{ height: 36, borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 11, width: "60%", borderRadius: 4 }} />
            </div>
          ))}
        </div>
        {/* Match cards */}
        <div className="match-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="campaign-match-card" style={{ opacity: 1 - i * 0.2 }}>
              <div className="skeleton" style={{ height: 16, width: "30%", borderRadius: 4 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
                <div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 52, width: 120, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
