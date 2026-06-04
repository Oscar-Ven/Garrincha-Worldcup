import Link from "next/link";
import Image from "next/image";

interface AdminSidebarProps {
  active: string;
  isSuperAdmin?: boolean;
  centerName?: string;
  adminName?: string;
}

const SUPER_LINKS = [
  { href: "/admin",          label: "Overview",       ic: "▦" },
  { href: "/admin/matches",  label: "Final Scores",   ic: "✏️" },
  { href: "/admin/bonus",    label: "Bonus Points",   ic: "🎁" },
  { href: "/admin/checkin",  label: "QR / Check-in",  ic: "📱" },
  { href: "/leaderboards",   label: "Leaderboards",   ic: "📊" },
  { href: "/admin/users",    label: "User Control",   ic: "👥" },
  { href: "/admin/health",   label: "System Health",  ic: "🩺" },
];

const CENTER_LINKS = [
  { href: "/admin",         label: "Overview",       ic: "▦" },
  { href: "/admin/checkin", label: "QR / Check-in",  ic: "📱" },
  { href: "/leaderboards",  label: "Leaderboards",   ic: "📊" },
];

export function AdminSidebar({ active, isSuperAdmin = false, centerName, adminName }: AdminSidebarProps) {
  const links = isSuperAdmin ? SUPER_LINKS : CENTER_LINKS;

  return (
    <aside className="admin-side">
      <div className="admin-side-top">
        <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
        <span className="admin-side-tag">ADMIN</span>
      </div>

      {/* Role indicator */}
      <div style={{ padding: "0 16px 12px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: isSuperAdmin ? "var(--gold)" : "var(--green)", marginBottom: 3 }}>
          {isSuperAdmin ? "Super Admin" : "Center Admin"}
        </div>
        {centerName && !isSuperAdmin && (
          <div className="disp" style={{ fontSize: 14, color: "var(--ink)", fontStyle: "italic" }}>{centerName}</div>
        )}
      </div>

      <nav className="admin-side-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`admin-nav-link${active === link.href ? " active" : ""}`}
            style={{ textDecoration: "none" }}
          >
            <span className="admin-nav-ic">{link.ic}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="admin-side-foot">
        <div className="admin-avatar">{(adminName?.[0] ?? "A").toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {adminName ?? "Admin"}
          </div>
          <div className="muted" style={{ fontSize: 11 }}>{isSuperAdmin ? "Platform" : "Center"}</div>
        </div>
        <Link href="/dashboard" style={{ color: "var(--ink-faint)", fontSize: 18, textDecoration: "none" }} title="Back to app">⎋</Link>
      </div>
    </aside>
  );
}
