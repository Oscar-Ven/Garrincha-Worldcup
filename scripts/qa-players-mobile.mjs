#!/usr/bin/env node
/**
 * Player-facing mobile QA script.
 *
 * USAGE
 *   npm run qa:players:mobile                        # hits localhost:3000
 *   BASE_URL=https://worldcup-garrincha.com npm run qa:players:mobile
 *
 * Checks:
 *   1. All player routes return HTTP 200
 *   2. No raw translation keys visible (t("...") patterns)
 *   3. Legal routes return HTTP 200
 *   4. API health endpoint returns ok
 *   5. No raw server error messages in HTML
 *   6. Critical CTAs (Register, Log in / access link) present on key pages
 *
 * This is a network-level check — it does not require a headless browser.
 * For full visual QA, use a real device or browser dev tools.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const PLAYER_ROUTES = [
  { path: "/",             label: "landing",     expectText: ["Register", "GARRINCHA"] },
  { path: "/register",     label: "register",    expectText: ["Register", "GARRINCHA"] },
  { path: "/login",        label: "login",       expectText: ["access link", "GARRINCHA"] },
  { path: "/matches",      label: "matches",     expectText: ["World Cup", "Match"] },
  { path: "/leaderboards", label: "leaderboards",expectText: ["Leaderboard", "GARRINCHA"] },
  { path: "/legal",        label: "legal",       expectText: ["Kempes BV", "worldcup-garrincha.com"] },
  { path: "/privacy",      label: "privacy",     expectText: ["Privacy", "GDPR", "Kempes BV"] },
  { path: "/terms",        label: "terms",       expectText: ["Terms", "Kempes BV"] },
  { path: "/cookies",      label: "cookies",     expectText: ["Cookie", "Kempes BV"] },
];

const API_ROUTES = [
  { path: "/api/health",   label: "health API",  expectJson: { status: "ok" } },
];

// Patterns that indicate broken translation keys or raw template output
// Note: HTML placeholder="..." attributes are intentional and excluded
const BAD_PATTERNS = [
  /t\(locale,\s*["']/,            // Raw t() calls in HTML (template not rendered)
  /auth\.[a-zA-Z]{5,}(?:\s|<)/,  // Likely missing translation key e.g. "auth.loginTitle "
  /\b(TODO|FIXME)\b/i,            // Debug markers (not "placeholder" — valid HTML attr)
  /\[object Object\]/,            // Serialization error
  /Internal Server Error/i,       // 500 leaking to UI
  /PrismaClient/,                 // DB error leaking
  /Cannot read prop/,             // JS error leaking
];

async function checkRoute({ path, label, expectText = [] }) {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { "Accept": "text/html", "User-Agent": "garrincha-qa/1.0" },
    });
    const ms = Date.now() - start;
    const html = await res.text();

    const issues = [];

    if (!res.ok) issues.push(`HTTP ${res.status}`);

    for (const pattern of BAD_PATTERNS) {
      if (pattern.test(html)) issues.push(`bad pattern: ${pattern}`);
    }

    for (const text of expectText) {
      if (!html.includes(text)) issues.push(`missing expected: "${text}"`);
    }

    const icon = issues.length === 0 ? "✓" : "✗";
    const status = `HTTP ${res.status} | ${ms}ms`;
    if (issues.length === 0) {
      console.log(`  ${icon} ${label.padEnd(14)} ${status}`);
    } else {
      console.log(`  ${icon} ${label.padEnd(14)} ${status} | ISSUES: ${issues.join(", ")}`);
    }
    return issues.length === 0;
  } catch (e) {
    console.log(`  ✗ ${label.padEnd(14)} FAILED: ${e.message}`);
    return false;
  }
}

async function checkApiRoute({ path, label, expectJson }) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const body = await res.json().catch(() => null);
    const issues = [];
    if (!res.ok) issues.push(`HTTP ${res.status}`);
    if (expectJson && body) {
      for (const [k, v] of Object.entries(expectJson)) {
        if (body[k] !== v) issues.push(`expected ${k}=${v}, got ${body[k]}`);
      }
    }
    const icon = issues.length === 0 ? "✓" : "✗";
    console.log(`  ${icon} ${label.padEnd(14)} HTTP ${res.status}${issues.length ? " | " + issues.join(", ") : ""}`);
    return issues.length === 0;
  } catch (e) {
    console.log(`  ✗ ${label.padEnd(14)} FAILED: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`\n=== GARRINCHA Player Mobile QA ===`);
  console.log(`Base URL: ${BASE_URL}\n`);

  console.log("Player routes:");
  const routeResults = await Promise.all(PLAYER_ROUTES.map(checkRoute));

  console.log("\nAPI routes:");
  const apiResults = await Promise.all(API_ROUTES.map(checkApiRoute));

  const total = routeResults.length + apiResults.length;
  const passed = [...routeResults, ...apiResults].filter(Boolean).length;

  console.log(`\nResult: ${passed}/${total} checks passed`);

  if (passed < total) {
    console.log("⚠  Some checks failed. Review issues above.");
    console.log("\nNOTE: For full mobile QA, test on real devices:");
    console.log("  - iPhone Safari (iOS 16+)");
    console.log("  - Android Chrome");
    console.log("  - Gmail in-app browser (access link flow)");
    console.log("  - WhatsApp in-app browser");
    process.exit(1);
  } else {
    console.log("\n✓ All player route checks passed.\n");
    console.log("Viewports to verify manually:");
    const viewports = [
      "320×568 (iPhone SE)",
      "360×640 (small Android)",
      "390×844 (iPhone 14)",
      "412×915 (Android XL)",
      "768×1024 (tablet)",
    ];
    viewports.forEach((v) => console.log(`  • ${v}`));
    console.log("\nRun screenshots: open browser devtools → responsive mode → capture above viewports");
    console.log("Save to: test-results/player-mobile-screenshots/\n");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
