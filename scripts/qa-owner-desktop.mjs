#!/usr/bin/env node
/**
 * Owner/manager desktop QA script.
 *
 * USAGE
 *   npm run qa:owner:desktop                        # hits localhost:3000
 *   BASE_URL=https://worldcup-garrincha.com npm run qa:owner:desktop
 *
 * Checks:
 *   1. Admin routes return 200 or 307/302 (auth redirect — acceptable)
 *   2. Admin login page is accessible
 *   3. No raw translation keys in admin HTML
 *   4. Admin routes do NOT return 500
 *   5. Health endpoint returns ok (confirms DB/cache status)
 *
 * NOTE: Admin routes require authentication.
 *   - Without an admin session this script checks redirect behavior (not raw 200).
 *   - A redirect to /admin/login is expected and correct for protected routes.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const ADMIN_ROUTES = [
  { path: "/admin/login",   label: "admin login",   expectStatus: [200] },
  { path: "/admin",         label: "admin home",    expectStatus: [200, 302, 307] },
  { path: "/admin/matches", label: "admin matches", expectStatus: [200, 302, 307] },
  { path: "/admin/users",   label: "admin users",   expectStatus: [200, 302, 307] },
  { path: "/admin/bonus",   label: "admin bonus",   expectStatus: [200, 302, 307] },
  { path: "/admin/checkin", label: "admin checkin", expectStatus: [200, 302, 307] },
  { path: "/admin/health",  label: "admin health",  expectStatus: [200, 302, 307] },
  { path: "/owner",         label: "owner dash",    expectStatus: [200, 302, 307] },
  { path: "/api/health",    label: "api health",    expectStatus: [200], expectJson: { status: "ok" } },
];

const BAD_PATTERNS = [
  /Internal Server Error/i,
  /PrismaClient/,
  /Cannot read prop/,
  /\[object Object\]/,
  /t\(locale,\s*["']/,
  /auth\.[a-zA-Z]{4,}(?:\s|<)/,
];

async function checkAdminRoute({ path, label, expectStatus, expectJson }) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "garrincha-desktop-qa/1.0" },
    });

    const status = res.status;
    const issues = [];

    if (expectStatus && !expectStatus.includes(status)) {
      issues.push(`unexpected HTTP ${status} (expected ${expectStatus.join(" or ")})`);
    }

    // 500 is always a failure
    if (status === 500) issues.push("HTTP 500 error");

    // Check content if 200
    if (status === 200) {
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        const html = await res.text();
        for (const p of BAD_PATTERNS) {
          if (p.test(html)) issues.push(`bad pattern: ${p}`);
        }
      } else if (contentType.includes("application/json") && expectJson) {
        const body = await res.json().catch(() => null);
        if (body) {
          for (const [k, v] of Object.entries(expectJson)) {
            if (body[k] !== v) issues.push(`JSON: expected ${k}=${v}, got ${body[k]}`);
          }
        }
      }
    }

    const icon = issues.length === 0 ? "✓" : "✗";
    const isRedirect = [301, 302, 307, 308].includes(status);
    const detail = isRedirect ? `→ ${res.headers.get("location")}` : "";
    console.log(`  ${icon} ${label.padEnd(14)} HTTP ${status} ${detail}${issues.length ? " | " + issues.join(", ") : ""}`);
    return issues.length === 0;
  } catch (e) {
    console.log(`  ✗ ${label.padEnd(14)} FAILED: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`\n=== GARRINCHA Owner/Manager Desktop QA ===`);
  console.log(`Base URL:   ${BASE_URL}`);
  console.log(`Target:     Desktop (1280px+ primary)\n`);

  console.log("Admin/owner routes:");
  const results = await Promise.all(ADMIN_ROUTES.map(checkAdminRoute));
  const passed = results.filter(Boolean).length;

  console.log(`\nResult: ${passed}/${results.length} checks passed`);

  if (passed < results.length) {
    console.log("⚠  Some checks failed.");
    process.exit(1);
  } else {
    console.log("\n✓ All admin route checks passed.\n");
    console.log("Desktop viewports to verify manually:");
    const viewports = [
      "1280×720", "1366×768", "1440×900", "1920×1080",
    ];
    viewports.forEach((v) => console.log(`  • ${v}`));
    console.log("\nVerify in browser:");
    console.log("  1. Log in at /admin/login");
    console.log("  2. Check KPI cards visible on /admin");
    console.log("  3. Check match list visible on /admin/matches");
    console.log("  4. Check score entry form works on /admin/matches");
    console.log("  5. Check users table visible on /admin/users");
    console.log("  6. Check health report visible on /admin/health");
    console.log("\nSave screenshots to: test-results/owner-manager-desktop-screenshots/\n");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
