export default function MatchesLoading() {
  return (
    <div className="matches-page">
      <div className="matches-page-header">
        <div className="matches-page-header-inner">
          <div className="skeleton" style={{ height: 13, width: 200, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 36, width: 280, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 320, borderRadius: 4 }} />
        </div>
      </div>
      <div className="matches-page-body">
        <div className="match-list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="campaign-match-card" style={{ opacity: 1 - i * 0.08 }}>
              <div className="skeleton" style={{ height: 16, width: "40%", borderRadius: 4 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginTop: 12 }}>
                <div className="skeleton" style={{ height: 44, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 44, width: 90, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 44, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
