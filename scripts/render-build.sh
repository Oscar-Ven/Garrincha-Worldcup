#!/usr/bin/env bash
# Render build script — every Render Web Service deployment runs this.
#
# -e  exit immediately if a command exits non-zero
# -u  treat unset variables as errors
# -x  print each command before executing it (visible in Render dashboard logs)
# -o pipefail  a pipe fails if any segment fails
set -euxo pipefail

echo ""
echo "============================================================"
echo " GARRINCHA World Cup — Render Build"
echo "============================================================"

# ── Environment sanity ──────────────────────────────────────────
echo ""
echo "[1/5] Environment"
node --version
npm --version
echo "NODE_ENV=${NODE_ENV:-not set}"
echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-not set}"
echo "DATABASE_URL shape: $(echo "${DATABASE_URL:-not set}" | sed 's|:[^@]*@|:***@|')"

# ── Install dependencies ────────────────────────────────────────
echo ""
echo "[2/5] Installing dependencies (npm ci --legacy-peer-deps)"
# Use npm ci for reproducible installs from the lockfile.
# --legacy-peer-deps is required because @sentry/nextjs has peer dep
# conflicts with some packages in this project.
#
# NPM_CONFIG_PRODUCTION=false ensures devDependencies are installed even when
# NODE_ENV=production. Next.js build tools (tailwindcss, postcss, etc.) are
# devDependencies and must be present during the build step.
NPM_CONFIG_PRODUCTION=false npm ci --legacy-peer-deps

# ── Next.js build (includes prisma generate internally) ─────────
# npm run build = "prisma generate && next build"
# We do NOT call prisma generate separately to avoid running it twice.
echo ""
echo "[3/5] Building Next.js (standalone output)"
npm run build

# ── Copy static assets into standalone output ───────────────────
echo ""
echo "[4/5] Copying static assets"

if [ ! -d ".next/standalone" ]; then
  echo "ERROR: .next/standalone directory not found after build."
  echo "  Make sure next.config.ts has output: 'standalone'."
  exit 1
fi

if [ -d "public" ]; then
  cp -r public .next/standalone/public
  echo "  Copied public/ → .next/standalone/public/"
else
  echo "  No public/ directory — skipping."
fi

if [ -d ".next/static" ]; then
  cp -r .next/static .next/standalone/.next/static
  echo "  Copied .next/static/ → .next/standalone/.next/static/"
else
  echo "  WARNING: .next/static not found — skipping."
fi

# ── Verify standalone server exists ─────────────────────────────
echo ""
echo "[5/5] Verifying standalone output"
if [ ! -f ".next/standalone/server.js" ]; then
  echo "ERROR: .next/standalone/server.js not found."
  exit 1
fi
ls -lh .next/standalone/server.js

echo ""
echo "============================================================"
echo " Build complete. Start command: node .next/standalone/server.js"
echo "============================================================"
