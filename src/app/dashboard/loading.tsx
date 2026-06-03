export default function DashboardLoading() {
  return (
    <main className="page">
      <div className="page-header">
        <span className="eyebrow" style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, color: "transparent", display: "inline-block", width: 120 }}>...</span>
        <div style={{ background: "rgba(8,235,154,0.18)", borderRadius: 8, height: "4rem", width: "60%" }} />
      </div>
      <div className="grid four" style={{ marginBottom: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat-card" style={{ opacity: 0.5 }}>
            <div style={{ background: "var(--line)", borderRadius: 4, height: 14, width: "55%" }} />
            <div style={{ background: "var(--line)", borderRadius: 4, height: 36, width: "40%" }} />
          </div>
        ))}
      </div>
      <div className="match-list">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="campaign-match-card" style={{ opacity: 0.45 - i * 0.07 }}>
            <div style={{ background: "var(--line)", borderRadius: 4, height: 16, width: "30%", margin: "0 auto" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr", gap: 18, alignItems: "center" }}>
              <div style={{ justifySelf: "center", background: "var(--line)", borderRadius: 8, height: 48, width: 64 }} />
              <div style={{ background: "var(--line)", borderRadius: 8, height: 52 }} />
              <div style={{ justifySelf: "center", background: "var(--line)", borderRadius: 8, height: 48, width: 64 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
