import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = "https://v3.football.api-sports.io";
const FLAGS_DIR = join(__dirname, "..", "public", "flags", "countries");
const CACHE_FILE = join(FLAGS_DIR, "countries_cache.json");

const force = process.argv.includes("--force");

const apiKey = process.env.FOOTBALL_DATA_API_KEY?.trim();
if (!apiKey) {
  console.error("Error: FOOTBALL_DATA_API_KEY is not set in environment.");
  process.exit(1);
}

interface ApiCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

interface ApiResponse {
  response: ApiCountry[];
}

interface CacheEntry {
  code: string;
  flag: string;
  remoteFlag: string;
}

async function main() {
  mkdirSync(FLAGS_DIR, { recursive: true });

  console.log("Fetching countries from API-Football...");

  const res = await fetch(`${BASE_URL}/countries`, {
    headers: { "x-apisports-key": apiKey as string },
  });

  if (!res.ok) {
    console.error(`Error: API request failed with status ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = (await res.json()) as ApiResponse;
  const countries: ApiCountry[] = data.response ?? [];

  console.log(`Total countries returned by API: ${countries.length}`);

  const valid = countries.filter(
    (c): c is ApiCountry & { name: string; code: string } =>
      typeof c.name === "string" &&
      c.name.trim().length > 0 &&
      typeof c.code === "string" &&
      /^[A-Z]{2}$/.test(c.code),
  );

  console.log(`Countries with valid 2-letter ISO codes: ${valid.length}`);
  if (force) console.log("--force flag set: existing files will be overwritten.");
  console.log(`Output folder: ${FLAGS_DIR}`);
  console.log("");

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  const cache: Record<string, CacheEntry> = {};

  if (existsSync(CACHE_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(CACHE_FILE, "utf-8")) as Record<string, CacheEntry>;
      Object.assign(cache, existing);
    } catch {
      // ignore corrupt or missing cache
    }
  }

  for (const country of valid) {
    const codeLower = country.code.toLowerCase();
    const localPath = join(FLAGS_DIR, `${codeLower}.svg`);
    const remoteUrl = country.flag ?? `https://media.api-sports.io/flags/${codeLower}.svg`;
    const localWebPath = `/flags/countries/${codeLower}.svg`;

    cache[country.name] = {
      code: country.code,
      flag: localWebPath,
      remoteFlag: remoteUrl,
    };

    if (existsSync(localPath) && !force) {
      skipped++;
      continue;
    }

    try {
      const flagRes = await fetch(remoteUrl);
      if (!flagRes.ok) {
        console.warn(`  ⚠  ${country.name} (${country.code}): download failed — ${flagRes.status} ${flagRes.statusText}`);
        failed++;
        continue;
      }
      const content = await flagRes.text();
      writeFileSync(localPath, content, "utf-8");
      console.log(`  ✓  ${country.name} (${country.code}) → ${codeLower}.svg`);
      downloaded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ⚠  ${country.name} (${country.code}): ${msg}`);
      failed++;
    }
  }

  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");

  console.log("");
  console.log("─".repeat(50));
  console.log(`  Total countries found:    ${countries.length}`);
  console.log(`  With valid ISO codes:     ${valid.length}`);
  console.log(`  Downloaded:               ${downloaded}`);
  console.log(`  Skipped (already exist):  ${skipped}`);
  console.log(`  Failed:                   ${failed}`);
  console.log(`  Cache file:               ${CACHE_FILE}`);
  console.log("─".repeat(50));

  if (failed > 0) {
    console.warn(`\nWarning: ${failed} flag(s) failed to download. Run again or check network.`);
  } else {
    console.log("\nDone.");
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Unexpected error: ${msg}`);
  process.exit(1);
});
