export default function LeaderboardsLoading() {
  return (
    <main className="page">
      <div className="page-header">
        <span style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, color: "transparent", display: "inline-block", width: 100 }}>.</span>
        <div style={{ background: "rgba(8,235,154,0.18)", borderRadius: 8, height: "4rem", width: "55%" }} />
      </div>
      <div className="card" style={{ opacity: 0.5 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--line)", display: "flex", gap: 12, alignItems: "center", padding: "13px 10px", opacity: 1 - i * 0.12 }}>
            <div style={{ background: "var(--line)", borderRadius: "50%", height: 30, width: 30, flexShrink: 0 }} />
            <div style={{ background: "var(--line)", borderRadius: 4, height: 14, width: `${180 - i * 20}px` }} />
            <div style={{ background: "var(--line)", borderRadius: 4, height: 14, width: 60, marginLeft: "auto" }} />
          </div>
        ))}
      </div>
    </main>
  );
}
