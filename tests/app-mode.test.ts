import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

async function loadAppMode() {
  vi.resetModules();
  return import("@/lib/app-mode");
}

describe("preview mode activation", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("uses preview mode locally when no database URL exists", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");

    const { isPreviewMode } = await loadAppMode();
    expect(isPreviewMode()).toBe(true);
  });

  it("does not use preview mode in production with a real database URL", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://user:password@db.example.com:5432/postgres?sslmode=require");
    vi.stubEnv("APP_PREVIEW_MODE", "true");

    const { hasDatabaseConfig, isPreviewMode } = await loadAppMode();
    expect(isPreviewMode()).toBe(false);
    expect(hasDatabaseConfig()).toBe(true);
  });

  it("does not silently preview in production without explicit demo mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("APP_PREVIEW_MODE", "false");

    const { isPreviewMode } = await loadAppMode();
    expect(isPreviewMode()).toBe(false);
  });

  it("treats malformed database URLs as not configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "not-a-database-url");

    const { hasDatabaseConfig, isPreviewMode } = await loadAppMode();
    expect(hasDatabaseConfig()).toBe(false);
    expect(isPreviewMode()).toBe(true);
  });

  it("treats non-postgresql URLs as not configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "https://db.example.com/postgres");

    const { hasDatabaseConfig, isPreviewMode } = await loadAppMode();
    expect(hasDatabaseConfig()).toBe(false);
    expect(isPreviewMode()).toBe(true);
  });
});
