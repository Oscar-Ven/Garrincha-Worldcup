import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, Stage } from "@prisma/client";
import { Pool } from "pg";
import { hash } from "bcryptjs";
import { seedFifaCodes } from "../src/lib/flags";
import { groupStageFixtures, knockoutFixtures, matchVenueLabel } from "../src/lib/world-cup-2026-fixtures";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const groups: Record<string, string[]> = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["United States", "Paraguay", "Australia", "Turkiye"],
  E: ["Germany", "Curacao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "Uzbekistan", "Colombia", "DR Congo"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

function codeFor(name: string) {
  return seedFifaCodes[name] ?? name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

async function upsertTeam(name: string, groupName?: string) {
  const fifaCode = codeFor(name);
  const flagCode = fifaCode.length === 3 ? fifaCode : "TBD";
  return prisma.team.upsert({
    where: { fifaCode },
    create: {
      name,
      fifaCode,
      groupName,
      flagUrl: `flag:${flagCode}`,
    },
    update: {
      name,
      groupName,
      flagUrl: `flag:${flagCode}`,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Set it to the Supabase pooled connection string before seeding.");
  }

  const ownerEmail = process.env.OWNER_EMAIL ?? "wc.garrincha@gmail.com";
  const ownerDisplayName = process.env.OWNER_DISPLAY_NAME ?? "GARRINCHA";
  const ownerPasswordPlain = process.env.OWNER_PASSWORD;

  if (!ownerPasswordPlain || ownerPasswordPlain.length < 8) {
    throw new Error("OWNER_PASSWORD must be set in .env (minimum 8 characters).");
  }

  // Ensure all GARRINCHA centers exist (players will register to these)
  const allCenters = [
    { name: "Head Quarter",                    country: "Belgium", city: "Brussels"  },
    { name: "GARRINCHA Antwerpen Noord",       country: "Belgium", city: "Antwerpen" },
    { name: "GARRINCHA Antwerpen Zuid",        country: "Belgium", city: "Antwerpen" },
    { name: "GARRINCHA Charleroi Dampremy",    country: "Belgium", city: "Charleroi" },
    { name: "GARRINCHA Charleroi Montignies",  country: "Belgium", city: "Charleroi" },
    { name: "GARRINCHA Diegem",                country: "Belgium", city: "Diegem"    },
    { name: "GARRINCHA Gent Arsenaal",         country: "Belgium", city: "Gent"      },
    { name: "GARRINCHA Gent The Loop",         country: "Belgium", city: "Gent"      },
    { name: "GARRINCHA Kortrijk",              country: "Belgium", city: "Kortrijk"  },
    { name: "GARRINCHA Luik",                  country: "Belgium", city: "Luik"      },
    { name: "GARRINCHA Westgate Dilbeek",      country: "Belgium", city: "Dilbeek"   },
  ];

  for (const center of allCenters) {
    await prisma.garrinchaCenter.upsert({
      where: { name: center.name },
      create: { ...center, bannerUrl: null },
      update: { country: center.country, city: center.city },
    });
  }

  const hq = await prisma.garrinchaCenter.findFirstOrThrow({
    where: { name: "Head Quarter" },
  });

  const ownerPassword = await hash(ownerPasswordPlain, 12);
  await prisma.user.upsert({
    where: { email: ownerEmail },
    create: {
      email: ownerEmail,
      passwordHash: ownerPassword,
      fullName: ownerDisplayName,
      nickname: ownerDisplayName,
      dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
      phoneNumber: process.env.OWNER_PHONE ?? "",
      displayName: ownerDisplayName,
      nationality: "Belgium",
      role: Role.SUPER_ADMIN,
      centerId: hq.id,
    },
    update: {
      passwordHash: ownerPassword,
      displayName: ownerDisplayName,
      fullName: ownerDisplayName,
      nickname: ownerDisplayName,
      role: Role.SUPER_ADMIN,
      centerId: hq.id,
    },
  });
  console.log(`Owner account: ${ownerEmail} (${ownerDisplayName}) → Head Quarter`);

  // Optional second SUPER_ADMIN — jef@garnicha.be
  // Set JEF_PASSWORD in .env to seed this account (minimum 8 characters).
  const jefPasswordPlain = process.env.JEF_PASSWORD;
  if (jefPasswordPlain && jefPasswordPlain.length >= 8) {
    const jefPasswordHash = await hash(jefPasswordPlain, 12);
    await prisma.user.upsert({
      where: { email: "jef@garnicha.be" },
      create: {
        email: "jef@garnicha.be",
        passwordHash: jefPasswordHash,
        fullName: "jef",
        nickname: "jef",
        dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
        phoneNumber: "+32491486970",
        displayName: "jef",
        nationality: "Belgium",
        role: Role.SUPER_ADMIN,
        centerId: hq.id,
      },
      update: {
        passwordHash: jefPasswordHash,
        fullName: "jef",
        nickname: "jef",
        phoneNumber: "+32491486970",
        displayName: "jef",
        role: Role.SUPER_ADMIN,
        centerId: hq.id,
      },
    });
    console.log("Owner account: jef@garnicha.be (jef) → Head Quarter");
  }

  const teams = new Map<string, Awaited<ReturnType<typeof upsertTeam>>>();
  for (const [groupName, names] of Object.entries(groups)) {
    for (const name of names) {
      teams.set(name, await upsertTeam(name, groupName));
    }
  }

  for (let slot = 1; slot <= 64; slot += 1) {
    const name = `TBD Slot ${slot}`;
    teams.set(name, await upsertTeam(name));
  }

  for (const fixture of groupStageFixtures) {
    const home = teams.get(fixture.homeTeam);
    const away = teams.get(fixture.awayTeam);
    if (!home || !away) {
      throw new Error(`Missing group fixture team for match ${fixture.fifaMatchNo}: ${fixture.homeTeam} vs ${fixture.awayTeam}`);
    }

    await prisma.match.upsert({
      where: { fifaMatchNo: fixture.fifaMatchNo },
      create: {
        fifaMatchNo: fixture.fifaMatchNo,
        stage: Stage.GROUP,
        venue: matchVenueLabel(fixture),
        kickoffAt: new Date(fixture.kickoffAt),
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
      update: {
        stage: Stage.GROUP,
        venue: matchVenueLabel(fixture),
        kickoffAt: new Date(fixture.kickoffAt),
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
    });
  }
  console.log(`Seeded ${groupStageFixtures.length} explicit group-stage fixtures.`);

  let placeholder = 1;
  for (const fixture of knockoutFixtures) {
    const home = teams.get(`TBD Slot ${placeholder}`);
    const away = teams.get(`TBD Slot ${placeholder + 1}`);
    if (!home || !away) throw new Error(`Missing knockout placeholder for match ${fixture.fifaMatchNo}`);
    await prisma.match.upsert({
      where: { fifaMatchNo: fixture.fifaMatchNo },
      create: {
        fifaMatchNo: fixture.fifaMatchNo,
        stage: Stage[fixture.stage],
        venue: matchVenueLabel(fixture),
        kickoffAt: new Date(fixture.kickoffAt),
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
      update: {
        stage: Stage[fixture.stage],
        venue: matchVenueLabel(fixture),
        kickoffAt: new Date(fixture.kickoffAt),
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
    });
    placeholder += 2;
  }

  console.log("Seed complete: 104 World Cup match slots, Head Quarter center, teams, and owner account.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
