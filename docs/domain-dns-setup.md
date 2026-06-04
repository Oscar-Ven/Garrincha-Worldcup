# Domain & DNS Setup: GoDaddy + Vercel + Resend

## Domain

**Production domain:** `worldcup-garrincha.com`  
**Registrar:** GoDaddy  
**Host:** Vercel  
**Email sender:** Resend (`noreply@worldcup-garrincha.com`)

---

## Step 1 — Connect Domain to Vercel

### 1a. Add domain in Vercel

1. Go to **Vercel Dashboard → Project → Settings → Domains**.
2. Add `worldcup-garrincha.com`.
3. Add `www.worldcup-garrincha.com`.
4. Vercel will show the exact DNS records required — use those values, not the ones below which are the standard Vercel records.

Standard Vercel DNS values (verify in your Vercel dashboard first):

| Type  | Name | Value                   |
|-------|------|-------------------------|
| A     | @    | `76.76.21.21`           |
| CNAME | www  | `cname.vercel-dns.com.` |

### 1b. Update GoDaddy DNS records

Log in to **GoDaddy → My Products → DNS** for `worldcup-garrincha.com`.

| Record  | Name            | Current Value                            | Action                              |
|---------|-----------------|------------------------------------------|-------------------------------------|
| A       | @               | WebsiteBuilder Site (GoDaddy managed)    | **CHANGE → Vercel A record**        |
| CNAME   | www             | `worldcup-garrincha.com.`                | **CHANGE → `cname.vercel-dns.com.`**|
| CNAME   | _domainconnect  | `_domainconnect.gd.domaincontrol.com.`   | **KEEP** (GoDaddy service record)   |
| NS      | @               | `ns11.domaincontrol.com.`                | **KEEP**                            |
| NS      | @               | `ns12.domaincontrol.com.`                | **KEEP**                            |
| SOA     | @               | Primary nameserver ns11                  | **KEEP** (auto-managed)             |
| TXT     | _dmarc          | `v=DMARC1; p=quarantine; ...`            | **KEEP / merge** — see Step 3       |

> **Do not delete or modify NS or SOA records.** Do not switch to Vercel nameservers — GoDaddy nameservers remain authoritative.

### 1c. Verify in Vercel

After saving GoDaddy DNS changes, return to Vercel → Domains. Vercel will automatically detect the records and mark the domain as verified (typically within a few minutes; up to 24–48 hours for full propagation).

---

## Step 2 — Resend Domain Verification (for email delivery)

`noreply@worldcup-garrincha.com` must be a verified sender domain in Resend before production emails will deliver.

### 2a. Add domain in Resend

1. Go to **Resend Dashboard → Domains → Add Domain**.
2. Enter `worldcup-garrincha.com`.
3. Resend will generate DNS records — **copy the exact values from Resend**, do not use generic ones.

### 2b. Expected record types from Resend

Resend typically requires:

| Type  | Name                        | Value (from Resend dashboard)         |
|-------|-----------------------------|---------------------------------------|
| TXT   | `resend._domainkey`         | DKIM public key (`p=...`)             |
| TXT   | `_dmarc` (or subdomain)     | DMARC policy — **merge with existing**|
| TXT   | @                           | SPF record (see caution below)        |

> **Get exact record names and values from Resend — they differ per account.**

### 2c. Add Resend records in GoDaddy

Add each TXT record Resend provides to GoDaddy DNS.

---

## Step 3 — SPF and DMARC Caution

### SPF (TXT @ record)

SPF allows only one TXT record at `@` that contains `v=spf1`. If GoDaddy already has an SPF record and Resend adds another, **merge them into one record**:

```
v=spf1 include:amazonses.com include:resend.com ~all
```

Adjust the `include:` entries to match what Resend specifies. Never create two separate `v=spf1` records — only the first is evaluated.

### DMARC (_dmarc TXT record)

GoDaddy already has a `_dmarc` TXT record:

```
v=DMARC1; p=quarantine; ...
```

If Resend requires a separate DMARC record at `_dmarc.worldcup-garrincha.com`, check whether it overlaps. Resend does not always require a DMARC entry — verify in their dashboard.

If both GoDaddy's existing record and Resend's requirements target the same `_dmarc` name, edit the existing record rather than creating a duplicate.

---

## Step 4 — Vercel Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables** for the **Production** environment. Do not paste values here — retrieve them from your `.secrets/` files and the Resend/Supabase dashboards.

### Required

| Variable                    | Notes                                                                      |
|-----------------------------|----------------------------------------------------------------------------|
| `DATABASE_URL`              | Supabase Transaction Pooler, port 6543, `pgbouncer=true`                  |
| `DIRECT_URL`                | Supabase direct URL, port 5432, for migrations only (not used at runtime)  |
| `JWT_SECRET`                | Strong random secret, min 32 characters                                    |
| `OWNER_EMAIL`               | `wc.garrincha@gmail.com`                                                   |
| `OWNER_PASSWORD`            | Owner account password from seed                                           |
| `ADMIN_PASSWORD`            | Admin account password from seed                                           |
| `CENTER_ADMIN_PASSWORD`     | Shared center admin password from seed                                     |
| `NEXT_PUBLIC_APP_URL`       | `https://worldcup-garrincha.com`                                           |
| `APP_PREVIEW_MODE`          | `false`                                                                    |
| `NEXT_PUBLIC_DEMO_MODE`     | `false`                                                                    |

### Email

| Variable      | Notes                                                                           |
|---------------|---------------------------------------------------------------------------------|
| `RESEND_API_KEY`  | Resend API key (only works after domain is verified in Resend)              |
| `EMAIL_FROM`      | `Garrincha World Cup Predictions <noreply@worldcup-garrincha.com>`          |

### Rate Limiting

| Variable                    | Notes                           |
|-----------------------------|---------------------------------|
| `UPSTASH_REDIS_REST_URL`    | Upstash REST endpoint           |
| `UPSTASH_REDIS_REST_TOKEN`  | Upstash REST token              |
| `REDIS_URL`                 | Upstash Redis URL (optional)    |

### Monitoring

| Variable                  | Notes                                          |
|---------------------------|------------------------------------------------|
| `NEXT_PUBLIC_SENTRY_DSN`  | Sentry DSN                                     |
| `SENTRY_DSN`              | Sentry DSN                                     |
| `SENTRY_ORG`              | `garrincha-worldcup`                           |
| `SENTRY_PROJECT`          | `garrincha-worldcup`                           |
| `SENTRY_AUTH_TOKEN`       | Required for source map uploads during builds  |

### Football Data (optional)

| Variable                         | Notes                              |
|----------------------------------|------------------------------------|
| `FOOTBALL_DATA_PROVIDER`         | Provider name, optional future use |
| `FOOTBALL_DATA_COMPETITION_CODE` | Competition code, optional         |
| `FOOTBALL_DATA_SEASON`           | Season, optional                   |
| `FOOTBALL_DATA_API_KEY`          | API key, optional                  |

---

## Step 5 — Post-Connection Verification

After DNS propagates and Vercel confirms the domain:

1. Open `https://worldcup-garrincha.com` — must load over HTTPS with a valid certificate.
2. Open `https://www.worldcup-garrincha.com` — must redirect to apex or load identically.
3. Run `npm run env:check` locally — `SUPABASE_READY=yes`.
4. In Resend, confirm domain status is **Verified**.
5. Send a test email via the `/admin` → access-link flow.
6. Open `/admin/health` as SUPER_ADMIN — all checks should be green.

---

## Safety Rules

- Do NOT delete NS or SOA records.
- Do NOT switch to Vercel nameservers unless explicitly required — GoDaddy nameservers remain.
- Do NOT merge DNS changes while GoDaddy WebsiteBuilder is still active — disable or detach WebsiteBuilder first if it controls the A record.
- Do NOT create two SPF records at `@`. Merge into one.
- Do NOT set `EMAIL_FROM` in Vercel until the Resend domain is verified — emails will bounce.
- Do NOT commit real API keys, passwords, or connection strings to the repository.
