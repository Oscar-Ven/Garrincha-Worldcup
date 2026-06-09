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
  Link2,
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
      label: "QR Registration Links",
      href: "/admin/qr",
      icon: Link2,
      roles: ["SUPER_ADMIN", "ADMIN"],
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
        router.push("/dashboard/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans antialiased">
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 select-none shadow-sm">
        {/* Brand strip — dark bg keeps white logo visible */}
        <div className="bg-gray-900 px-5 py-4 flex items-center gap-3">
          <div className="relative h-7 w-32 shrink-0">
            <Image
              src="/branding/garrincha-white.png"
              alt="GARRINCHA"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-green-400 border border-green-700/60 bg-green-900/40 px-2 py-0.5 whitespace-nowrap shrink-0">
            Dashboard
          </span>
        </div>

        {/* Role label */}
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span className="text-xs text-gray-500 font-medium">
            {isOwner ? "Owner Portal" : "Manager Portal"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                  active
                    ? "bg-green-50 text-green-700 font-semibold border-l-2 border-green-600 pl-2.5"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${active ? "text-green-600" : "text-gray-400"}`}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
              {user.nickname.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</div>
              <div className="text-xs text-gray-500 truncate">
                {isOwner ? "Global Owner" : user.centerName}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors text-xs font-medium rounded-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Layout ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
          <div className="bg-gray-900 px-3 py-1.5 flex items-center gap-2">
            <div className="relative h-5 w-24">
              <Image
                src="/branding/garrincha-white.png"
                alt="GARRINCHA"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden absolute top-14 left-0 w-full bg-white border-b border-gray-200 shadow-lg z-30 flex flex-col p-4 animate-in slide-in-from-top-1 select-none">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-gray-700">
                {isOwner ? "Owner Mode" : `Manager: ${user.centerName}`}
              </span>
            </div>
            <nav className="space-y-0.5 mb-4">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                      active
                        ? "bg-green-50 text-green-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${active ? "text-green-600" : "text-gray-400"}`}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-medium rounded-sm whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
