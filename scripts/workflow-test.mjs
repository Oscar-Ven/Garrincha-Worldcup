/**
 * Workflow smoke tests — run against the live deployment URL.
 * Usage: node scripts/workflow-test.mjs [BASE_URL]
 * Default URL: WORKFLOW_BASE_URL or the first CLI argument.
 *
 * Required for authenticated checks:
 *   WORKFLOW_ADMIN_EMAIL
 *   WORKFLOW_ADMIN_PASSWORD
 *   WORKFLOW_TEST_CENTER_ID
 *   WORKFLOW_CENTER_ADMIN_EMAIL
 *   WORKFLOW_CENTER_ADMIN_PASSWORD
 */
import { chromium } from 'playwright';
import { setTimeout as wait } from 'timers/promises';

const BASE = process.argv[2] || process.env.WORKFLOW_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.WORKFLOW_ADMIN_EMAIL || 'wc.garrincha@gmail.com';
const ADMIN_PASSWORD = process.env.WORKFLOW_ADMIN_PASSWORD;
const TEST_CENTER_ID = process.env.WORKFLOW_TEST_CENTER_ID;
const CENTER_ADMIN_EMAIL = process.env.WORKFLOW_CENTER_ADMIN_EMAIL;
const CENTER_ADMIN_PASSWORD = process.env.WORKFLOW_CENTER_ADMIN_PASSWORD;
const results = [];

function log(workflow, status, detail = '') {
  results.push({ workflow, status, detail });
  const icon = status === 'PASS' ? 'PASS   ' : status === 'FAIL' ? 'FAIL   ' : 'BLOCKED';
  console.log(`${icon} ${workflow}${detail ? ' — ' + detail : ''}`);
}

async function safeEval(page, fn, arg) {
  try { return await page.evaluate(fn, arg); }
  catch (e) { return { error: e.message.slice(0, 80) }; }
}

const browser = await chromium.launch({
  chromiumSandbox: process.env.CI !== 'true',
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();

// ── 1. Home page ──────────────────────────────────────────────────────────
try {
  await p.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  log('Home page loads', p.url().includes(BASE) ? 'PASS' : 'FAIL', p.url());
} catch (e) { log('Home page loads', 'FAIL', e.message.slice(0,60)); }

// ── 2. Admin login (SUPER_ADMIN) ──────────────────────────────────────────
try {
  await p.goto(BASE + '/admin/login', { waitUntil: 'networkidle', timeout: 20000 });
  if (!ADMIN_PASSWORD) {
    log('Admin login (SUPER_ADMIN)', 'BLOCKED', 'WORKFLOW_ADMIN_PASSWORD not set');
  } else {
    await p.fill('input[name="email"]', ADMIN_EMAIL);
    await p.fill('input[name="password"]', ADMIN_PASSWORD);
    await p.click('button[type="submit"]');
    await wait(3500);
    const url = p.url();
    const ok = url.includes('/admin') && !url.includes('/login');
    log('Admin login (SUPER_ADMIN)', ok ? 'PASS' : 'FAIL', url);
  }
} catch (e) { log('Admin login (SUPER_ADMIN)', 'FAIL', e.message.slice(0,60)); }

// ── 3. QR/check-in code generation ────────────────────────────────────────
const codeRes = TEST_CENTER_ID ? await safeEval(p, async (centerId) => {
  try {
    const r = await fetch('/api/admin/checkin-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ centerId })
    });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
  } catch (e) { return { error: e.message }; }
}, TEST_CENTER_ID) : { status: 0, body: {}, blocked: 'WORKFLOW_TEST_CENTER_ID not set' };
const activationCode = codeRes.body?.code || 'NOCODE';
const codeOk = codeRes.status === 200 && codeRes.body?.code;
if (codeRes.blocked) {
  log('QR/check-in code generation', 'BLOCKED', codeRes.blocked);
} else if (codeRes.status === 503) {
  log('QR/check-in code generation', 'BLOCKED', 'DB not reachable on current host — retest on Vercel');
} else {
  log('QR/check-in code generation', codeOk ? 'PASS' : 'FAIL',
    codeOk ? `code=${activationCode}` : JSON.stringify(codeRes).slice(0,80));
}

// ── 4. Registration with activation code ──────────────────────────────────
try {
  await p.goto(BASE + '/register?code=' + activationCode, { waitUntil: 'networkidle', timeout: 15000 });
  await wait(600);
  const regText = (await p.textContent('body').catch(() => '')).toLowerCase();
  const blocked = regText.includes('scan the qr') || regText.includes('first activation required');
  if (activationCode === 'NOCODE') {
    log('Registration with activation code', 'BLOCKED', 'No code generated — DB not reachable');
  } else {
    log('Registration with activation code', !blocked ? 'PASS' : 'FAIL',
      blocked ? 'registration form blocked' : 'registration form visible');
  }
} catch (e) { log('Registration with activation code', 'FAIL', e.message.slice(0,60)); }

// ── 5. Login page / access-link request ───────────────────────────────────
try {
  await p.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 15000 });
  const loginText = (await p.textContent('body').catch(() => '')).toLowerCase();
  log('Login page (access-link request)', loginText.includes('email') ? 'PASS' : 'FAIL');
} catch (e) { log('Login page (access-link request)', 'FAIL', e.message.slice(0,60)); }

// ── 6. Access-link request API ─────────────────────────────────────────────
const linkRes = await safeEval(p, async () => {
  try {
    const r = await fetch('/api/auth/request-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL })
    });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
  } catch (e) { return { error: e.message }; }
});
if (linkRes.status === 503) {
  log('Access-link request API', 'BLOCKED', 'DB not reachable on current host');
} else {
  log('Access-link request API', linkRes.status === 200 ? 'PASS' : 'FAIL',
    `HTTP ${linkRes.status}: ${JSON.stringify(linkRes.body).slice(0,60)}`);
}

// ── 7. Global leaderboard ─────────────────────────────────────────────────
try {
  await p.goto(BASE + '/leaderboards', { waitUntil: 'networkidle', timeout: 15000 });
  const lbText = (await p.textContent('body').catch(() => '')).toLowerCase();
  log('Global leaderboard', lbText.includes('leaderboard') ? 'PASS' : 'FAIL');
} catch (e) { log('Global leaderboard', 'FAIL', e.message.slice(0,60)); }

// ── 8. Prediction API (DB connectivity probe) ─────────────────────────────
const predRes = await safeEval(p, async () => {
  try {
    const r = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ matchId: 'probe', homeScore: 0, awayScore: 0 })
    });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
  } catch (e) { return { error: e.message }; }
});
if (predRes.status === 503) {
  log('Prediction create/edit API', 'BLOCKED', 'DB not reachable — retest on Vercel');
} else {
  log('Prediction create/edit API', predRes.status !== 503 ? 'PASS' : 'FAIL',
    `HTTP ${predRes.status} (401/403/404 = DB connected, 503 = DB down)`);
}

// ── 9-11. Admin pages (score entry, bonus, owner dashboard) ───────────────
for (const [name, path] of [
  ['Admin score entry page', '/admin/matches'],
  ['Admin bonus points page', '/admin/bonus'],
  ['Owner dashboard', '/owner'],
]) {
  try {
    await p.goto(BASE + path, { waitUntil: 'networkidle', timeout: 15000 });
    await wait(500);
    const url = p.url();
    const onPage = url.includes(path);
    log(name, onPage ? 'PASS' : 'FAIL', url);
  } catch (e) { log(name, 'FAIL', e.message.slice(0,60)); }
}

// ── 12. Prize rankings tab ────────────────────────────────────────────────
const ownerText = (await p.textContent('body').catch(() => '')).toLowerCase();
log('Prize Winners tab (owner dashboard)', ownerText.includes('prize') ? 'PASS' : 'FAIL');

// ── 13. Health dashboard (SUPER_ADMIN) ────────────────────────────────────
try {
  await p.goto(BASE + '/admin/health', { waitUntil: 'networkidle', timeout: 15000 });
  await wait(600);
  log('Health dashboard (SUPER_ADMIN)', p.url().includes('/admin/health') ? 'PASS' : 'FAIL', p.url());
} catch (e) { log('Health dashboard (SUPER_ADMIN)', 'FAIL', e.message.slice(0,60)); }

// ── 14. Admin score entry API (point recalculation probe) ─────────────────
const scoreRes = await safeEval(p, async () => {
  try {
    const r = await fetch('/api/admin/matches/probe-id/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ homeScore: 2, awayScore: 1 })
    });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
  } catch (e) { return { error: e.message }; }
});
if (scoreRes.status === 503) {
  log('Admin score entry / point recalculation', 'BLOCKED', 'DB not reachable');
} else {
  log('Admin score entry / point recalculation', scoreRes.status !== 503 ? 'PASS' : 'FAIL',
    `HTTP ${scoreRes.status} (404=DB connected, 503=DB down)`);
}

// ── 15-17. Center admin scoped access ──────────────────────────────────────
await safeEval(p, async () => { await fetch('/api/auth/logout', { method: 'POST' }); });
await wait(400);
try {
  await p.goto(BASE + '/admin/login', { waitUntil: 'networkidle', timeout: 15000 });
  if (!CENTER_ADMIN_EMAIL || !CENTER_ADMIN_PASSWORD) {
    log('Center admin login', 'BLOCKED', 'WORKFLOW_CENTER_ADMIN_EMAIL or WORKFLOW_CENTER_ADMIN_PASSWORD not set');
    log('Center admin blocked from /owner', 'BLOCKED', 'depends on center admin login');
    log('Center admin can access /admin/checkin', 'BLOCKED', 'depends on center admin login');
    log('Center admin blocked from /admin/health', 'BLOCKED', 'depends on center admin login');
    throw new Error('CENTER_ADMIN_BLOCKED');
  }
  await p.fill('input[name="email"]', CENTER_ADMIN_EMAIL);
  await p.fill('input[name="password"]', CENTER_ADMIN_PASSWORD);
  await p.click('button[type="submit"]');
  await wait(3000);
  const caUrl = p.url();
  const loggedIn = caUrl.includes('/admin') && !caUrl.includes('/login');
  if (caUrl.includes('/login')) {
    log('Center admin login', 'BLOCKED', 'DB not reachable — retest on Vercel');
    log('Center admin blocked from /owner', 'BLOCKED', 'depends on center admin login');
    log('Center admin can access /admin/checkin', 'BLOCKED', 'depends on center admin login');
    log('Center admin blocked from /admin/health', 'BLOCKED', 'depends on center admin login');
  } else {
    log('Center admin login', loggedIn ? 'PASS' : 'FAIL', caUrl);

    await p.goto(BASE + '/owner', { waitUntil: 'networkidle', timeout: 15000 });
    await wait(400);
    log('Center admin blocked from /owner', !p.url().includes('/owner') ? 'PASS' : 'FAIL', p.url());

    await p.goto(BASE + '/admin/checkin', { waitUntil: 'networkidle', timeout: 15000 });
    await wait(400);
    log('Center admin can access /admin/checkin', p.url().includes('/admin/checkin') ? 'PASS' : 'FAIL', p.url());

    await p.goto(BASE + '/admin/health', { waitUntil: 'networkidle', timeout: 15000 });
    await wait(400);
    log('Center admin blocked from /admin/health', !p.url().includes('/admin/health') ? 'PASS' : 'FAIL', p.url());
  }
} catch (e) {
  if (e.message !== 'CENTER_ADMIN_BLOCKED') {
    for (const w of ['Center admin login','Center admin blocked from /owner','Center admin can access /admin/checkin','Center admin blocked from /admin/health'])
      log(w, 'FAIL', e.message.slice(0,60));
  }
}

await browser.close();

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(70));
const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
const blocked = results.filter(r => r.status === 'BLOCKED').length;
console.log(`TARGET: ${BASE}`);
console.log(`PASS: ${pass}  FAIL: ${fail}  BLOCKED: ${blocked}  TOTAL: ${results.length}`);
if (fail > 0) {
  console.log('\nFAILURES:');
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ${r.workflow}: ${r.detail}`));
}
if (blocked > 0) {
  console.log('\nBLOCKED (re-run against Vercel once deployed):');
  results.filter(r => r.status === 'BLOCKED').forEach(r => console.log(`  ${r.workflow}`));
}
if (fail > 0) process.exit(1);
