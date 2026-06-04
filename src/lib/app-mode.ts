const PLACEHOLDER_PATTERNS = [
  "replace-with",
  "replace-with-your",
  "replace-with-a-long-random-secret",
  "replace-with-owner-password",
  "replace-with-admin-password",
  "[YOUR-APP-DOMAIN]",
  "[PROJECT-REF]",
  "[PASSWORD]",
  "your-password",
  "your-domain",
  "your-project",
];

export function hasUsableDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) return false;
  if (isPlaceholderValue(value)) return false;

  try {
    const url = new URL(value);
    // Accept both postgresql:// (standard) and postgres:// (Supabase/Heroku shortform)
    const validProtocol = url.protocol === "postgresql:" || url.protocol === "postgres:";
    return validProtocol && Boolean(url.hostname && url.username && url.pathname !== "/");
  } catch {
    return false;
  }
}

export function isExplicitPreviewMode() {
  return process.env.APP_PREVIEW_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isPreviewMode() {
  if (hasUsableDatabaseUrl()) return false;
  if (process.env.NODE_ENV === "production" && !isExplicitPreviewMode()) return false;
  return true;
}

export function hasDatabaseConfig() {
  return !isPreviewMode() && hasUsableDatabaseUrl();
}

export function isPlaceholderValue(value: string) {
  const normalized = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern.toLowerCase()));
}
