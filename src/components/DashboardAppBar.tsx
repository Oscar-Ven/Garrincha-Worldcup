function getInitials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export function DashboardAppBar({ displayName }: { displayName: string }) {
  return (
    <header className="app-bar">
      <button className="app-bar-menu" aria-label="Menu" type="button">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="app-bar-center" aria-label="GARRINCHA World Cup">
        <svg className="app-bar-trophy-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 2h12v5a6 6 0 01-12 0z"/>
          <path d="M3 3H1v2a4 4 0 004 4M21 3h2v2a4 4 0 01-4 4"/>
          <path d="M8 15h8l-1 5H9z"/>
          <path d="M8 20h8"/>
        </svg>
        <span className="app-bar-title">GARRINCHA</span>
      </div>

      <div className="app-bar-avatar" aria-label={`Profile — ${displayName}`}>
        {getInitials(displayName)}
      </div>
    </header>
  );
}
