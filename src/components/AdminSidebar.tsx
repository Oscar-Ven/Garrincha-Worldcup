import Link from "next/link";
import Image from "next/image";

interface AdminSidebarProps {
  active: string;
  isSuperAdmin?: boolean;
  centerName?: string;
  adminName?: string;
}

// SVG icon components
function IconGrid() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

function IconScore() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 10h12M4 6h8M4 14h6" strokeLinecap="round" />
      <circle cx="15" cy="14" r="3" />
      <path d="M15 12.5v1.5l1 1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="9" width="14" height="9" rx="1" />
      <path d="M2 9h16v2H2z" />
      <path d="M10 9V18M10 9C10 7 8 5 6.5 6S6 9 10 9M10 9C10 7 12 5 13.5 6S14 9 10 9" strokeLinecap="round" />
    </svg>
  );
}

function IconQr() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="6" height="6" rx="0.5" />
      <rect x="5" y="5" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="11" y="3" width="6" height="6" rx="0.5" />
      <rect x="13" y="5" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="3" y="11" width="6" height="6" rx="0.5" />
      <rect x="5" y="13" width="2" height="2" fill="currentColor" stroke="none" />
      <path d="M11 11h2v2h-2zM13 13h2v2h-2zM15 11h2M11 15h2v2M15 15v2" strokeLinecap="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 15l4-4 4 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17h14" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
      <path d="M14 5a3 3 0 1 1 0 4M18 17c0-2.5-1.8-4-4-4" strokeLinecap="round" />
    </svg>
  );
}

function IconHealth() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 10h3l2-5 3 10 2-5h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCrown() {
  return (
    <svg className="manager-nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 15h14M3 15l2-7 5 4 5-4 2 7H3z" strokeLinejoin="round" />
      <circle cx="10" cy="5" r="1.5" />
    </svg>
  );
}

function IconExit() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 4h4v12h-4M8 14l5-4-5-4M12 10H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface NavLink { href: string; label: string; Icon: React.FC }

const SUPER_LINKS: NavLink[] = [
  { href: "/admin",         label: "Overview",       Icon: IconGrid },
  { href: "/admin/matches", label: "Final Scores",   Icon: IconScore },
  { href: "/admin/bonus",   label: "Bonus Points",   Icon: IconGift },
  { href: "/admin/checkin", label: "QR / Check-in",  Icon: IconQr },
  { href: "/leaderboards",  label: "Leaderboards",   Icon: IconChart },
  { href: "/admin/users",   label: "User Control",   Icon: IconUsers },
  { href: "/admin/health",  label: "System Health",  Icon: IconHealth },
  { href: "/owner",         label: "Owner Dashboard",Icon: IconCrown },
];

const CENTER_LINKS: NavLink[] = [
  { href: "/admin",         label: "Overview",       Icon: IconGrid },
  { href: "/admin/checkin", label: "QR / Check-in",  Icon: IconQr },
  { href: "/leaderboards",  label: "Leaderboards",   Icon: IconChart },
];

export function AdminSidebar({ active, isSuperAdmin = false, centerName, adminName }: AdminSidebarProps) {
  const links = isSuperAdmin ? SUPER_LINKS : CENTER_LINKS;

  return (
    <aside className="manager-sidebar">
      {/* Logo + badge */}
      <div className="manager-sidebar-top">
        <Image src="/garrincha-white.png" alt="GARRINCHA" height={18} width={108} style={{ height: 18, width: "auto" }} />
        <span className={`manager-badge${isSuperAdmin ? " manager-badge--owner" : ""}`}>
          {isSuperAdmin ? "OWNER" : "MANAGER"}
        </span>
      </div>

      {/* Role row */}
      <div className="manager-role-row">
        <div className={`manager-role-label${isSuperAdmin ? " manager-role-label--owner" : ""}`}>
          {isSuperAdmin ? "Platform Owner" : "Center Manager"}
        </div>
        {centerName && !isSuperAdmin && (
          <div className="manager-role-center">{centerName}</div>
        )}
      </div>

      {/* Nav links */}
      <nav className="manager-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`manager-nav-link${active === link.href ? " active" : ""}`}
          >
            <link.Icon />
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="manager-sidebar-foot">
        <div className="manager-avatar">{(adminName?.[0] ?? "M").toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {adminName ?? "Manager"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{isSuperAdmin ? "Platform" : "Center"}</div>
        </div>
        <Link href="/dashboard" style={{ color: "var(--text-3)", display: "flex" }} title="Back to app">
          <IconExit />
        </Link>
      </div>
    </aside>
  );
}
