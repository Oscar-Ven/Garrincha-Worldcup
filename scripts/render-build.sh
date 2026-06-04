#!/bin/bash
# Render build script — run during every Render deployment.
set -e  # exit on first error

echo "==> Node: $(node -v)  npm: $(npm -v)"

echo "==> Installing dependencies"
npm ci --legacy-peer-deps

echo "==> Generating Prisma client"
npm run db:generate

echo "==> Building Next.js (standalone mode)"
npm run build

echo "==> Copying static assets into standalone output"
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "==> Build complete"
ls -la .next/standalone/server.js
