"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Flame,
  Coins,
  QrCode,
  Activity,
  LogOut,
  Menu,
  X,
  Building,
  Shield,
  History,
  ClipboardList,
} from "lucide-react";

interface AdminUser {
  email: string;
  fullName: string;
  nickname: string;
  role: string;
  centerName: string;
  centerId: string;
}

interface Props {
  user: AdminUser;
  children: React.ReactNode;
}

export default function AdminLayoutClientShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOwner = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  // Build role-aware navigation
  const links = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_ADMIN"],
    },
    {
      label: isOwner ? "Managers & Players" : "Players Directory",
      href: "/admin/users",
      icon: Users,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_ADMIN"],
    },
    {
      label: "Centers Overview",
      href: "/admin/centers",
      icon: Building,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      label: "Leaderboards",
      href: "/admin/leaderboards",
      icon: Flame,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_ADMIN"],
    },
    {
      label: "Matches & Scoring",
      href: "/admin/matches",
      icon: ClipboardList,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_ADMIN"],
    },
    {
      label: "Award Bonus Points",
      href: "/admin/bonus",
      icon: Coins,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_ADMIN"],
    },
    {
      label: isOwner ? "Check-in Codes" : "Center Check-Ins",
      href: "/admin/checkin",
      icon: QrCode,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_ADMIN"],
    },
    {
      label: "Audit Ledger",
      href: "/admin/audit",
      icon: History,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      label: "System Health",
      href: "/admin/health",
      icon: Activity,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  const visibleLinks = links.filter((link) => link.roles.includes(user.role));

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans antialiased">
      {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 shrink-0 select-none">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex flex-col gap-3">
          <div className="relative h-7 w-auto">
            <Image
              src="/branding/garrincha-white.png"
              alt="GARRINCHA"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-lime-400/20 bg-lime-400/10 w-fit">
            <Shield className="w-3 h-3 text-lime-400" />
            <span className="text-lime-400 font-black uppercase tracking-wider text-[9px]">
              {isOwner ? "Owner Portal" : "Manager Portal"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-lime-400 text-zinc-950 shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer/Profile info */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-lime-400 uppercase">
              {user.nickname.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-white truncate uppercase tracking-tight">
                {user.fullName}
              </div>
              <div className="text-[10px] text-zinc-500 truncate mt-0.5 leading-none">
                {isOwner ? "Global Owner" : user.centerName}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Layout Frame ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between z-40 select-none">
          <div className="relative h-6 w-32">
            <Image
              src="/branding/garrincha-white.png"
              alt="GARRINCHA"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 border border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-zinc-900 border-b border-zinc-800 shadow-2xl z-30 flex flex-col p-6 animate-in slide-in-from-top-1 select-none">
            <div className="flex items-center gap-2 mb-4 px-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 bg-lime-400/10 px-2 py-1 border border-lime-400/25">
                {isOwner ? "Owner Mode" : `Manager: ${user.centerName}`}
              </span>
            </div>
            <nav className="space-y-1 mb-6">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-lime-400 text-zinc-950"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate uppercase">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 border border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-white text-[11px] font-bold uppercase tracking-wider"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="flex-1 p-6 md:p-10 relative overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
