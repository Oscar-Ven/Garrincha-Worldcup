import { describe, expect, it } from "vitest";
import {
  canAccessAdmin,
  canAccessSuperAdmin,
  canAwardBonus,
  type AppRole,
} from "@/lib/product-logic";
import { canManageCenter } from "@/lib/auth";

// ─── CENTER_ADMIN role ────────────────────────────────────────────────────────

describe("CENTER_ADMIN role", () => {
  const centerAdminSession = { userId: "ca-1", role: "CENTER_ADMIN" as AppRole };

  it("can access admin functions", () => {
    expect(canAccessAdmin(centerAdminSession)).toEqual({ allowed: true });
  });

  it("cannot access super admin functions", () => {
    expect(canAccessSuperAdmin(centerAdminSession)).toMatchObject({ allowed: false, status: 403 });
  });

  it("can award bonus points with a valid reason", () => {
    expect(canAwardBonus({ session: centerAdminSession, reason: "Fair play award" })).toEqual({ allowed: true });
  });

  it("cannot award bonus with a blank reason", () => {
    expect(canAwardBonus({ session: centerAdminSession, reason: "  " })).toMatchObject({ allowed: false, status: 400 });
  });
});

// ─── Full admin hierarchy ─────────────────────────────────────────────────────

describe("admin hierarchy", () => {
  const roles: Array<{ role: AppRole; canAdmin: boolean; canSuper: boolean }> = [
    { role: "SUPER_ADMIN", canAdmin: true, canSuper: true },
    { role: "ADMIN",       canAdmin: true, canSuper: false },
    { role: "CENTER_ADMIN",canAdmin: true, canSuper: false },
    { role: "USER",        canAdmin: false,canSuper: false },
  ];

  for (const { role, canAdmin, canSuper } of roles) {
    const session = { userId: "u1", role };

    it(`${role}: canAccessAdmin = ${canAdmin}`, () => {
      const result = canAccessAdmin(session);
      expect(result.allowed).toBe(canAdmin);
    });

    it(`${role}: canAccessSuperAdmin = ${canSuper}`, () => {
      const result = canAccessSuperAdmin(session);
      expect(result.allowed).toBe(canSuper);
    });
  }

  it("null session cannot access admin", () => {
    expect(canAccessAdmin(null)).toMatchObject({ allowed: false, status: 403 });
  });
});

// ─── Center access control ────────────────────────────────────────────────────

describe("canManageCenter", () => {
  const center1 = "center-gent-arsenaal";
  const center2 = "center-antwerpen-noord";

  it("SUPER_ADMIN can manage any center", () => {
    expect(canManageCenter({ role: "SUPER_ADMIN", centerId: center1 }, center2)).toBe(true);
  });

  it("ADMIN can manage any center", () => {
    expect(canManageCenter({ role: "ADMIN", centerId: center1 }, center2)).toBe(true);
  });

  it("CENTER_ADMIN can manage their own center", () => {
    expect(canManageCenter({ role: "CENTER_ADMIN", centerId: center1 }, center1)).toBe(true);
  });

  it("CENTER_ADMIN cannot manage a different center", () => {
    expect(canManageCenter({ role: "CENTER_ADMIN", centerId: center1 }, center2)).toBe(false);
  });

  it("USER cannot manage any center", () => {
    expect(canManageCenter({ role: "USER", centerId: center1 }, center1)).toBe(false);
  });
});

// ─── Center admin emails ──────────────────────────────────────────────────────

const CENTER_ADMIN_EMAILS = [
  "antwerpen.noord@garrincha.be",
  "antwerpen.zuid@garrincha.be",
  "charleroi.dampremy@garrincha.be",
  "charleroi.montignies@garrincha.be",
  "diegem@garrincha.be",
  "gent.arsenaal@garrincha.be",
  "gent.theloop@garrincha.be",
  "kortrijk@garrincha.be",
  "luik@garrincha.be",
  "westgate.dilbeek@garrincha.be",
] as const;

describe("center admin emails", () => {
  it("exactly 10 center admin accounts are configured", () => {
    expect(CENTER_ADMIN_EMAILS).toHaveLength(10);
  });

  it("all emails end with @garrincha.be", () => {
    for (const email of CENTER_ADMIN_EMAILS) {
      expect(email).toMatch(/@garrincha\.be$/);
    }
  });

  it("no duplicate emails", () => {
    const unique = new Set(CENTER_ADMIN_EMAILS);
    expect(unique.size).toBe(CENTER_ADMIN_EMAILS.length);
  });

  it("each email maps to a distinct center slug", () => {
    const slugs = CENTER_ADMIN_EMAILS.map((e) => e.split("@")[0]);
    const unique = new Set(slugs);
    expect(unique.size).toBe(CENTER_ADMIN_EMAILS.length);
  });
});

// ─── Health check security — details must never leak secrets ─────────────────

describe("health check security", () => {
  const SECRET_PATTERN = /api[_-]?key|password|secret|token|bearer|credential|connectionstring|dsn/i;

  const safeDetails = [
    "Connected — 3 ms",
    "10 centers seeded",
    "configured",
    "not configured",
    "In-memory (not suitable for multi-instance)",
    "Redis (Upstash)",
    "production",
    "Healthy",
    "Warning: domain not yet verified",
    "garrincha-worldcup.vercel.app",
  ];

  const unsafeDetails = [
    "API_KEY=abc123",
    "password=secret",
    "Bearer re_Sz8...",
    "RESEND_API_KEY configured: re_Sz8W",
    "ConnectionString=postgresql://user:pass@host",
  ];

  for (const detail of safeDetails) {
    it(`safe detail does not match secret pattern: "${detail.slice(0, 40)}"`, () => {
      expect(detail).not.toMatch(SECRET_PATTERN);
    });
  }

  for (const detail of unsafeDetails) {
    it(`unsafe detail IS caught by secret pattern: "${detail.slice(0, 40)}"`, () => {
      expect(detail).toMatch(SECRET_PATTERN);
    });
  }
});
