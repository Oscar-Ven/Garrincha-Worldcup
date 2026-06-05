import Image from "next/image";
import Link from "next/link";

function getInitials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export function DashboardAppBar({
  displayName,
  subtitle = "WC 2026",
}: {
  displayName: string;
  subtitle?: string;
}) {
  return (
    <div className="dash-app-bar">
      {/* Left: GARRINCHA logo + subtitle */}
      <Link href="/" className="dash-app-bar-brand" aria-label="GARRINCHA home">
        <Image
          src="/garrincha-white.png"
          alt="GARRINCHA"
          height={20}
          width={120}
          style={{ height: 20, width: "auto" }}
          priority
        />
        <span className="dash-app-bar-subtitle">{subtitle}</span>
      </Link>

      {/* Right: avatar + logout */}
      <div className="dash-app-bar-right">
        <Link href="/dashboard" className="dash-app-bar-avatar" aria-label={`Dashboard — ${displayName}`}>
          {getInitials(displayName)}
        </Link>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="dash-app-bar-logout" aria-label="Log out">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
