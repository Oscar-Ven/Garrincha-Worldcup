# Render Deployment

## Service configuration

| Setting | Value |
|---------|-------|
| Service type | Web Service (not Static Site) |
| Runtime | Node 20 |
| Region | Frankfurt (eu-central-1 — same region as Supabase project) |
| Plan | Free (512 MB RAM — see Memory note below) |
| Branch | `main` |
| Build command | `bash scripts/render-build.sh` |
| Start command | `node .next/standalone/server.js` |
| Health check path | `/` |

## How to read build logs

The Render API does not expose build logs — you must use the Render dashboard:

1. Log in to [render.com](https://render.com) with `wc.garrincha@gmail.com`.
2. Open the `garrincha-worldcup` service.
3. Click **Deploys** in the left menu.
4. Click a failed deploy row.
5. The **Logs** tab shows the full build output.

The build script uses `set -euxo pipefail` and prints `[1/5]` through `[5/5]` step labels.  
The last step label printed before the failure is the failing command.

## Required environment variables

Set these in **Render → Service → Environment**. Do not put secrets in `render.yaml`.

### Required

| Variable | Notes |
|----------|-------|
| `NODE_VERSION` | `20.18.0` (or any Node 20 release) |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render injects this automatically) |
| `HOSTNAME` | `0.0.0.0` |
| `NEXT_TELEMETRY_DISABLED` | `1` (reduces build output noise) |
| `DATABASE_URL` | Supabase direct connection `postgresql://postgres:PASS@db.REF.supabase.co:5432/postgres` |
| `DIRECT_URL` | Same as `DATABASE_URL` (Render uses a persistent process — no pooler needed) |
| `JWT_SECRET` | Random 32+ character secret |
| `OWNER_EMAIL` | Super admin login email |
| `OWNER_PASSWORD` | Super admin password |
| `ADMIN_PASSWORD` | Main admin password |
| `CENTER_ADMIN_PASSWORD` | Shared center admin password |
| `NEXT_PUBLIC_APP_NAME` | `GARRINCHA World Cup` |
| `NEXT_PUBLIC_APP_URL` | `https://yourservice.onrender.com` (or custom domain) |
| `APP_PREVIEW_MODE` | `false` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

### Email (Resend)

| Variable | Notes |
|----------|-------|
| `RESEND_API_KEY` | From Resend dashboard |
| `EMAIL_FROM` | `Garrincha World Cup Predictions <noreply@yourdomain>` |

### Rate limiting (Upstash Redis)

| Variable | Notes |
|----------|-------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `REDIS_URL` | Upstash Redis URL |

### Sentry (optional — enables source map upload)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | Public DSN — safe to expose |
| `SENTRY_DSN` | Server-side DSN |
| `SENTRY_ORG` | `garrincha-worldcup` |
| `SENTRY_PROJECT` | `garrincha-worldcup` |
| `SENTRY_AUTH_TOKEN` | **Optional.** Without this, Sentry still runs at runtime but source maps are NOT uploaded during build. Set this only after confirming the build works. |

> **Note:** `SENTRY_AUTH_TOKEN` is intentionally optional. The build will succeed without it. Source map uploads are gated on this variable in `next.config.ts`.

## Common build failures

### 1. `npm ci --legacy-peer-deps` fails

**Symptom:** Build fails at step `[2/5]` — exits early after `npm ci`.

**Causes:**
- `package-lock.json` is out of sync with `package.json`
- A native binary fails to download (network issue)
- A postinstall script fails

**Fix:**
- Run `npm install --legacy-peer-deps` locally and commit the updated `package-lock.json`
- Check if there are network restrictions in the Render build environment (rare on paid plans)

### 2. Prisma generate fails

**Symptom:** Build fails at step `[3/5]` during `prisma generate`.

**Causes:**
- `DATABASE_URL` is missing or malformed
- Prisma can't parse the connection string

**Fix:**
- Verify `DATABASE_URL` is set correctly in Render environment
- Must be a valid `postgresql://` URL pointing to Supabase direct connection

### 3. Next.js build fails

**Symptom:** Build fails at step `[3/5]` during `next build` (after Prisma generate succeeds).

**Causes:**
- TypeScript errors (run `npm run typecheck` locally first)
- Import errors
- Sentry config issue (see Sentry section below)
- Memory exhaustion (see Memory section below)

**Fix:**
- Always verify `npm run build` passes locally before pushing to Render

### 4. Sentry config issue

**Symptom:** Build fails inside `next build` with a Sentry-related error.

**Causes:**
- Invalid `SENTRY_AUTH_TOKEN` format — personal tokens (`sntryu_`) may not work for source map upload
- Sentry servers unreachable from the build environment

**Fix:**
- Leave `SENTRY_AUTH_TOKEN` unset or set to empty string `""` — the build is safe without it
- Source map upload is disabled when `SENTRY_AUTH_TOKEN` is not set (gated in `next.config.ts`)
- If you do set it, use an **auth token** from Sentry (not a personal token)

### 5. Memory limit exceeded

**Symptom:** Build fails with no clear error, or is killed mid-build.

**Cause:** Render free tier has 512 MB RAM. Next.js + Sentry webpack plugin can exceed this.

**Fix:**
- **Recommended:** Upgrade to Render Starter plan ($7/month, 512 MB dedicated) or Standard plan ($25/month, 1 GB)
- Free tier is not reliable for Next.js production builds with webpack

### 6. Missing `.next/standalone` after build

**Symptom:** Build step `[4/5]` fails with "ERROR: .next/standalone directory not found".

**Cause:** `next.config.ts` does not have `output: "standalone"`, or the build succeeded but wrote to a different location.

**Fix:**
- Verify `next.config.ts` has `output: "standalone"` in the `nextConfig` object
- Check the Render build logs for any `next build` warnings about output mode

### 7. `cp` command not found

**Symptom:** Build fails at step `[4/5]` with `cp: command not found`.

**Cause:** Extremely unlikely on Linux (Render uses Ubuntu). If it happens, the build environment is broken.

**Fix:** Contact Render support.

## Standalone output

The app uses `output: "standalone"` in `next.config.ts`. This creates:

```
.next/standalone/server.js        ← entry point
.next/standalone/public/          ← copied by build script
.next/standalone/.next/static/    ← copied by build script
```

Start command: `node .next/standalone/server.js`

The build script copies `public/` and `.next/static/` after the build because Next.js standalone mode does not include them automatically.

## Recommended Render upgrade path

| Plan | RAM | Suitable for |
|------|-----|-------------|
| Free | 512 MB shared | Development/testing only |
| Starter ($7/mo) | 512 MB dedicated | Small production apps |
| Standard ($25/mo) | 1 GB | Production Next.js apps |

For a production World Cup prediction campaign with potentially hundreds of concurrent users, **Starter or Standard is recommended**.

## Deploy hook (optional GitHub Actions integration)

If `RENDER_TOKEN` and `RENDER_SERVICE_ID` are set as GitHub secrets:
- The `deploy-render.yml` workflow triggers a deploy on every CI success on `main`
- Without these secrets, Render still auto-deploys via its GitHub polling (checks every 1 minute)

To get the service ID: `srv-d8gl6e37uimc73ahssdg`  
To get the deploy hook URL: Render dashboard → Service → Settings → Deploy Hook
