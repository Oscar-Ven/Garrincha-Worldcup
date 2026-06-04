import { execFileSync } from "node:child_process";
import dns from "node:dns/promises";
import { readFileSync } from "node:fs";

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "OWNER_PASSWORD",
  "ADMIN_PASSWORD",
  "CENTER_ADMIN_PASSWORD",
  "NEXT_PUBLIC_APP_URL",
];

const placeholderPatterns = [
  "[PROJECT-REF]",
  "[YOUR-APP-DOMAIN]",
  "[PASSWORD]",
  "your-password",
  "your-project",
  "replace-with",
  "replace-with-your",
];

function readEnvFile() {
  try {
    return readFileSync(".env", "utf8");
  } catch {
    return null;
  }
}

function getEnvValue(text, name) {
  const match = text.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, "m"));
  if (!match) return "";

  const raw = match[1].trim();
  if ((raw.startsWith("\"") && raw.endsWith("\"")) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function hasPlaceholder(value) {
  return placeholderPatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
}

function isUsablePostgresUrl(value) {
  if (!value || !value.startsWith("postgresql://")) return false;
  if (hasPlaceholder(value)) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "postgresql:" && Boolean(parsed.hostname && parsed.username && parsed.pathname !== "/");
  } catch {
    return false;
  }
}

function safeUrlStatus(value) {
  if (!value) return "missing";
  if (!value.startsWith("postgresql://")) return "not_postgresql";
  if (hasPlaceholder(value)) return "placeholder";

  try {
    const parsed = new URL(value);
    if (!parsed.hostname || !parsed.username || parsed.pathname === "/") return "malformed";
    return "usable_format";
  } catch {
    return "malformed";
  }
}

function postgresUrlDetails(value) {
  try {
    const parsed = new URL(value);
    const isPooler = parsed.hostname.endsWith(".pooler.supabase.com");
    const isDirect = parsed.hostname.startsWith("db.") && parsed.hostname.endsWith(".supabase.co");
    const hasPgbouncer = parsed.searchParams.get("pgbouncer") === "true";

    return {
      host: parsed.hostname,
      kind: isPooler ? "supabase_pooler" : isDirect ? "supabase_direct" : "other",
      port: parsed.port,
      hasPgbouncer,
    };
  } catch {
    return null;
  }
}

function secretStatus(value, minLength) {
  if (!value) return "missing";
  if (hasPlaceholder(value)) return "placeholder";
  if (value.length < minLength) return "too_short";
  return "ok";
}

function appUrlStatus(value) {
  if (!value) return "missing";
  if (hasPlaceholder(value)) return "placeholder";

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.hostname === "localhost" ? "ok" : "not_https";
  } catch {
    return "malformed";
  }
}

function optionalSecretStatus(value) {
  if (!value) return "missing";
  if (hasPlaceholder(value)) return "placeholder";
  return "configured";
}

function optionalUrlStatus(value, expectedProtocol) {
  if (!value) return "missing";
  if (hasPlaceholder(value)) return "placeholder";

  try {
    const parsed = new URL(value);
    return expectedProtocol && parsed.protocol !== expectedProtocol ? "wrong_protocol" : "configured";
  } catch {
    return "malformed";
  }
}

async function hostResolves(hostname) {
  try {
    await Promise.any([dns.resolve4(hostname), dns.resolve6(hostname)]);
    return true;
  } catch {
    try {
      execFileSync("nslookup", [hostname], { stdio: "pipe", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

const envText = readEnvFile();
if (!envText) {
  console.log("ENV_FILE=missing");
  process.exit(2);
}

console.log("ENV_FILE=present");

const names = new Set([...envText.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map((match) => match[1]));
const present = required.filter((name) => names.has(name));
const missing = required.filter((name) => !names.has(name));

console.log(`REQUIRED_PRESENT=${present.join(",")}`);
console.log(`REQUIRED_MISSING=${missing.length ? missing.join(",") : "none"}`);

const databaseUrl = getEnvValue(envText, "DATABASE_URL");
const directUrl = getEnvValue(envText, "DIRECT_URL");
const jwtSecret = getEnvValue(envText, "JWT_SECRET");
const ownerPassword = getEnvValue(envText, "OWNER_PASSWORD");
const adminPassword = getEnvValue(envText, "ADMIN_PASSWORD");
const centerAdminPassword = getEnvValue(envText, "CENTER_ADMIN_PASSWORD");
const appUrl = getEnvValue(envText, "NEXT_PUBLIC_APP_URL");
const resendApiKey = getEnvValue(envText, "RESEND_API_KEY");
const emailFrom = getEnvValue(envText, "EMAIL_FROM");
const upstashRedisUrl = getEnvValue(envText, "UPSTASH_REDIS_REST_URL");
const upstashRedisToken = getEnvValue(envText, "UPSTASH_REDIS_REST_TOKEN");
const sentryDsn = getEnvValue(envText, "SENTRY_DSN") || getEnvValue(envText, "NEXT_PUBLIC_SENTRY_DSN");
const footballApiKey = getEnvValue(envText, "FOOTBALL_DATA_API_KEY");

console.log(`DATABASE_URL_STATUS=${safeUrlStatus(databaseUrl)}`);
console.log(`DIRECT_URL_STATUS=${safeUrlStatus(directUrl)}`);
console.log(`JWT_SECRET_STATUS=${secretStatus(jwtSecret, 32)}`);
console.log(`OWNER_PASSWORD_STATUS=${secretStatus(ownerPassword, 8)}`);
console.log(`ADMIN_PASSWORD_STATUS=${secretStatus(adminPassword, 8)}`);
console.log(`CENTER_ADMIN_PASSWORD_STATUS=${secretStatus(centerAdminPassword, 8)}`);
console.log(`NEXT_PUBLIC_APP_URL_STATUS=${appUrlStatus(appUrl)}`);
console.log(`RESEND_API_KEY_STATUS=${optionalSecretStatus(resendApiKey)}`);
console.log(`EMAIL_FROM_STATUS=${optionalSecretStatus(emailFrom)}`);
console.log(`UPSTASH_REDIS_REST_URL_STATUS=${optionalUrlStatus(upstashRedisUrl, "https:")}`);
console.log(`UPSTASH_REDIS_REST_TOKEN_STATUS=${optionalSecretStatus(upstashRedisToken)}`);
console.log(`SENTRY_DSN_STATUS=${optionalUrlStatus(sentryDsn, "https:")}`);
console.log(`FOOTBALL_DATA_API_KEY_STATUS=${optionalSecretStatus(footballApiKey)}`);

const basicSecretsReady =
  secretStatus(jwtSecret, 32) === "ok" &&
  secretStatus(ownerPassword, 8) === "ok" &&
  secretStatus(adminPassword, 8) === "ok" &&
  secretStatus(centerAdminPassword, 8) === "ok" &&
  appUrlStatus(appUrl) === "ok";

if (missing.length > 0 || !isUsablePostgresUrl(databaseUrl) || !isUsablePostgresUrl(directUrl) || !basicSecretsReady) {
  console.log("SUPABASE_READY=no");
  process.exit(1);
}

const databaseDetails = postgresUrlDetails(databaseUrl);
const directDetails = postgresUrlDetails(directUrl);

const databaseRuntimeReady =
  databaseDetails?.kind === "supabase_pooler" &&
  databaseDetails.port === "6543" &&
  databaseDetails.hasPgbouncer;
const directMigrationReady = directDetails?.kind === "supabase_direct" && directDetails.port === "5432";

console.log(`DATABASE_URL_KIND=${databaseDetails?.kind ?? "unknown"}`);
console.log(`DATABASE_URL_RUNTIME_READY=${databaseRuntimeReady ? "yes" : "no"}`);
console.log(`DIRECT_URL_KIND=${directDetails?.kind ?? "unknown"}`);
console.log(`DIRECT_URL_MIGRATION_READY=${directMigrationReady ? "yes" : "no"}`);

const directHost = new URL(directUrl).hostname;
if (!(await hostResolves(directHost))) {
  console.log("DIRECT_URL_DNS=not_resolved");
  console.log("SUPABASE_READY=no");
  process.exit(1);
}

console.log("DIRECT_URL_DNS=resolves");
console.log(`SUPABASE_READY=${databaseRuntimeReady && directMigrationReady ? "yes" : "no"}`);
if (!databaseRuntimeReady || !directMigrationReady) process.exit(1);
