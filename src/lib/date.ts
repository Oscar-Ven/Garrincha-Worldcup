const BRUSSELS_TZ = "Europe/Brussels";

export function formatBelgiumTime(kickoffAt: string | Date): string {
  const date = typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BRUSSELS_TZ,
  }).format(date);
}

export function formatBelgiumDateShort(kickoffAt: string | Date): string {
  const date = typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: BRUSSELS_TZ,
  }).format(date);
}

export function formatBelgiumDateLong(kickoffAt: string | Date): string {
  const date = typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: BRUSSELS_TZ,
  }).format(date);
}

export function formatBelgiumDateTime(kickoffAt: string | Date): string {
  const date = typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BRUSSELS_TZ,
  }).format(date);
}

export function getBelgiumDateKey(kickoffAt: string | Date): string {
  const date = typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  // en-CA locale reliably produces YYYY-MM-DD format
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: BRUSSELS_TZ,
  }).format(date);
}
