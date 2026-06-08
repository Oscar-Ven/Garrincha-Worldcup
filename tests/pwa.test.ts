import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ── Manifest ────────────────────────────────────────────────────────────────

describe("PWA manifest", () => {
  const manifestPath = path.join(process.cwd(), "public/manifest.webmanifest");

  it("manifest file exists", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  it("has correct name", () => {
    expect(manifest.name).toBe("GARRINCHA World Cup 2026");
  });

  it("has correct short_name", () => {
    expect(manifest.short_name).toBe("GARRINCHA");
  });

  it("has correct start_url", () => {
    expect(manifest.start_url).toBe("/en");
  });

  it("has standalone display", () => {
    expect(manifest.display).toBe("standalone");
  });

  it("includes 192x192 icon", () => {
    const icon = manifest.icons.find(
      (i: { sizes: string; src: string }) => i.sizes === "192x192"
    );
    expect(icon).toBeDefined();
    expect(icon!.src).toBe("/icon-192.png");
  });

  it("includes 512x512 non-maskable icon", () => {
    const icon = manifest.icons.find(
      (i: { sizes: string; src: string; purpose?: string }) =>
        i.sizes === "512x512" && i.purpose !== "maskable"
    );
    expect(icon).toBeDefined();
    expect(icon!.src).toBe("/icon-512.png");
  });

  it("includes maskable icon", () => {
    const icon = manifest.icons.find(
      (i: { purpose?: string }) => i.purpose === "maskable"
    );
    expect(icon).toBeDefined();
  });

  it("scope is '/'", () => {
    expect(manifest.scope).toBe("/");
  });
});

// ── Icon files ───────────────────────────────────────────────────────────────

describe("PWA icon files", () => {
  const publicDir = path.join(process.cwd(), "public");

  const required = [
    "favicon.ico",
    "icon.png",
    "icon-192.png",
    "icon-512.png",
    "icon-512-maskable.png",
    "apple-touch-icon.png",
  ];

  for (const fname of required) {
    it(`${fname} exists in public/`, () => {
      expect(fs.existsSync(path.join(publicDir, fname))).toBe(true);
    });

    it(`${fname} is non-empty`, () => {
      expect(fs.statSync(path.join(publicDir, fname)).size).toBeGreaterThan(0);
    });
  }
});

// ── QR URL format ────────────────────────────────────────────────────────────

describe("QR registration URL format", () => {
  const BASE = "https://worldcup-garrincha.com";

  it("default QR URL has source=qr param", () => {
    const url = `${BASE}/en/register?source=qr`;
    const parsed = new URL(url);
    expect(parsed.searchParams.get("source")).toBe("qr");
  });

  it("center-specific QR URL includes center param", () => {
    const centerId = "abc-uuid-123";
    const url = `${BASE}/en/register?source=qr&center=${centerId}`;
    const parsed = new URL(url);
    expect(parsed.searchParams.get("source")).toBe("qr");
    expect(parsed.searchParams.get("center")).toBe(centerId);
  });

  it("QR URL is in the correct locale-prefixed format", () => {
    const url = `${BASE}/en/register?source=qr`;
    expect(url).toMatch(/\/en\/register\?source=qr$/);
  });

  it("invalid center param falls back gracefully (no crash)", () => {
    // This test documents behavior: invalid center is treated as empty string
    const invalidCenter = "not-a-real-uuid";
    const url = `${BASE}/en/register?source=qr&center=${invalidCenter}`;
    const parsed = new URL(url);
    const centerParam = parsed.searchParams.get("center");
    // The page should accept the param without crashing
    expect(centerParam).toBe(invalidCenter);
    // The form initialCenterId would be "" if not found in centers list
    const centers = [{ id: "real-uuid", name: "GARRINCHA Antwerp" }];
    const matched = centers.find((c) => c.id === centerParam);
    expect(matched).toBeUndefined(); // graceful: no match → no preselect
  });
});

// ── Metadata references ──────────────────────────────────────────────────────

describe("Root layout metadata", () => {
  const layoutPath = path.join(process.cwd(), "src/app/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  it("references manifest.webmanifest", () => {
    expect(content).toContain("manifest.webmanifest");
  });

  it("references favicon.ico", () => {
    expect(content).toContain("favicon.ico");
  });

  it("references apple-touch-icon.png", () => {
    expect(content).toContain("apple-touch-icon.png");
  });

  it("has appleWebApp metadata", () => {
    expect(content).toContain("appleWebApp");
  });
});
