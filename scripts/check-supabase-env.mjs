import { readFileSync } from "node:fs";
import dns from "node:dns/promises";

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "OWNER_PASSWORD",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_APP_URL",
];

const placeholderPatterns = [
  "[PROJECT-REF]",
  "[PASSWORD]",
  "your-password",
  "your-project",
  "replace-with-your",
  "example",
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

function isUsablePostgresUrl(value) {
  if (!value || !value.startsWith("postgresql://")) return false;
  if (placeholderPatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()))) return false;

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
  if (placeholderPatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()))) return "placeholder";

  try {
    const parsed = new URL(value);
    if (!parsed.hostname || !parsed.username || parsed.pathname === "/") return "malformed";
    return "usable_format";
  } catch {
    return "malformed";
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

console.log(`DATABASE_URL_STATUS=${safeUrlStatus(databaseUrl)}`);
console.log(`DIRECT_URL_STATUS=${safeUrlStatus(directUrl)}`);

if (missing.length > 0 || !isUsablePostgresUrl(databaseUrl) || !isUsablePostgresUrl(directUrl)) {
  console.log("SUPABASE_READY=no");
  process.exit(1);
}

try {
  const directHost = new URL(directUrl).hostname;
  await dns.lookup(directHost);
  console.log("DIRECT_URL_DNS=resolves");
  console.log("SUPABASE_READY=yes");
} catch {
  console.log("DIRECT_URL_DNS=not_resolved");
  console.log("SUPABASE_READY=no");
  process.exit(1);
}
