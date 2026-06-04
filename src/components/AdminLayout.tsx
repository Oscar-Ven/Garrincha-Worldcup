"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface NavItem { k: string; label: string; ic: string; }

interface AdminLayoutProps {
  role: "super" | "center";
  page: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
  pageTitle: string;
  breadcrumb: string;
  centerName?: string;
}

const NAV_SUPER: NavItem[] = [
  { k: "overview",     label: "Overview",       ic: "▦" },
  { k: "centers",      label: "Centers",         ic: "🏟" },
  { k: "players",      label: "Players",         ic: "👥" },
  { k: "leaderboards", label: "Leaderboards",    ic: "📊" },
  { k: "prizes",       label: "Prize winners",   ic: "🏆" },
  { k: "qr",           label: "QR tools",        ic: "📱" },
  { k: "health",       label: "System health",   ic: "🩺" },
];

const NAV_CENTER: NavItem[] = [
  { k: "overview",     label: "Overview",        ic: "▦" },
  { k: "players",      label: "Center players",  ic: "👥" },
  { k: "leaderboards", label: "Leaderboard",     ic: "📊" },
  { k: "prizes",       label: "Prize winners",   ic: "🏆" },
  { k: "qr",           label: "Center QR",       ic: "📱" },
];

function Dot({ ok }: { ok: boolean }) {
  return <span className="svc-dot" style={{ background: ok ? "var(--green)" : "var(--gold)", boxShadow: `0 0 8px ${ok ? "var(--green)" : "var(--gold)"}` }} />;
}

export function AdminLayout({ role, page, onNavigate, children, pageTitle, breadcrumb }: AdminLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);
  const nav = role === "super" ? NAV_SUPER : NAV_CENTER;

  return (
    <div className="admin-root">
      {/* sidebar */}
      <aside className={`admin-side${navOpen ? " open" : ""}`}>
        <div className="admin-side-top">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
          <span className="admin-side-tag">ADMIN</span>
        </div>

        {/* role switch */}
        <div className="admin-role-switch">
          <Link href="/admin" className={`admin-role-btn${role === "super" ? " active" : ""}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>Super</Link>
          <button className={`admin-role-btn${role === "center" ? " active" : ""}`} onClick={() => {}}>Center</button>
        </div>

        {/* nav */}
        <nav className="admin-side-nav">
          {nav.map((n) => (
            <button
              key={n.k}
              className={`admin-nav-link${page === n.k ? " active" : ""}`}
              onClick={() => { onNavigate(n.k); setNavOpen(false); }}
            >
              <span className="admin-nav-ic">{n.ic}</span>
              {n.label}
              {n.k === "health" && role === "super" && <Dot ok={false} />}
            </button>
          ))}
        </nav>

        <div className="admin-side-foot">
          <div className="admin-avatar">A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Admin</div>
            <div className="muted" style={{ fontSize: 11 }}>{role === "super" ? "Platform" : "Center"}</div>
          </div>
          <Link href="/dashboard" style={{ color: "var(--ink-faint)", fontSize: 18, textDecoration: "none" }}>⎋</Link>
        </div>
      </aside>

      {navOpen && <div className="admin-scrim" onClick={() => setNavOpen(false)} />}

      {/* main */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-hamb" onClick={() => setNavOpen(true)}>☰</button>
          <div>
            <div className="admin-topbar-crumb">{breadcrumb}</div>
            <h1 className="admin-topbar-title">{pageTitle}</h1>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-preview-tag">👁 Live data</span>
            <span className="admin-date-pill">
              {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
