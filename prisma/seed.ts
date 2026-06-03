import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, Stage } from "@prisma/client";
import { hash } from "bcryptjs";
import { seedFifaCodes } from "../src/lib/flags";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

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

function venueFor(matchNo: number) {
  return `TBD official venue #${matchNo}`;
}

/*
 * World Cup 2026 schedule placeholder (June 11 - July 19, 2026).
 *
 * This repo does not yet contain the official FIFA match-by-match schedule.
 * These UTC kickoffs are structured placeholders so prediction locking has a
 * deterministic UTC value during local and Supabase smoke testing.
 *
 * Before public launch, replace these values with official FIFA dates, UTC
 * kickoff times, venue names, team pairings, and knockout slot labels.
 *
 * All kickoffAt values are UTC.
 */

/**
 * FIFA World Cup 2026 schedule (June 11 – July 19, 2026).
 *
 * Group stage (matchNo 1–72):
 *   - Groups organised 6 matches each (MD1 × 2, MD2 × 2, MD3 × 2).
 *   - Pairs of groups share the same calendar day for MD1 and MD2.
 *   - MD3 matches within the same group kick off simultaneously.
 *   - MD1: June 11–16  |  MD2: June 17–22  |  MD3: June 23–26
 *
 * Knockout stage (matchNo 73–104):
 *   - R32: June 27 – July 2  |  R16: July 3–6
 *   - QF: July 9 & 11  |  SF: July 14–15
 *   - Third place: July 18  |  Final: July 19
 *
 * All times are UTC.
 */
function kickoff(matchNo: number): Date {
  if (matchNo <= 72) {
    const groupIndex = Math.floor((matchNo - 1) / 6); // 0 (A) – 11 (L)
    const matchInGroup = (matchNo - 1) % 6; // 0–5
    const matchday = Math.floor(matchInGroup / 2); // 0=MD1, 1=MD2, 2=MD3
    const pairIndex = matchInGroup % 2; // 0 or 1 within matchday

    if (matchday === 0) {
      // MD1: June 11–16, group pair per day, two time slots
      const groupPair = Math.floor(groupIndex / 2);
      const base = Date.UTC(2026, 5, 11 + groupPair);
      return new Date(base + (pairIndex === 0 ? 17 : 20) * 60 * 60 * 1000);
    } else if (matchday === 1) {
      // MD2: June 17–22, same structure as MD1
      const groupPair = Math.floor(groupIndex / 2);
      const base = Date.UTC(2026, 5, 17 + groupPair);
      return new Date(base + (pairIndex === 0 ? 17 : 20) * 60 * 60 * 1000);
    } else {
      // MD3: June 23–26, three groups per day, simultaneous within each group
      const md3Day = Math.floor(groupIndex / 3); // 0–3
      const md3Slot = groupIndex % 3; // 0, 1, 2
      const base = Date.UTC(2026, 5, 23 + md3Day);
      const slotHours = [16, 19, 22] as const;
      return new Date(base + slotHours[md3Slot] * 60 * 60 * 1000);
    }
  }

  const k = matchNo - 72; // 1–32

  if (k <= 16) {
    // Round of 32: June 27 – July 2, three matches per day
    const day = Math.floor((k - 1) / 3);
    const slot = (k - 1) % 3;
    const slotHours = [17, 20, 23] as const;
    const base = Date.UTC(2026, 5, 27 + day); // JS Date.UTC handles month overflow
    return new Date(base + slotHours[slot] * 60 * 60 * 1000);
  } else if (k <= 24) {
    // Round of 16: July 3–6, two matches per day
    const r = k - 16; // 1–8
    const day = Math.floor((r - 1) / 2);
    const base = Date.UTC(2026, 6, 3 + day);
    return new Date(base + ((r - 1) % 2 === 0 ? 18 : 22) * 60 * 60 * 1000);
  } else if (k <= 28) {
    // Quarter-finals: July 9 and July 11, two matches per day
    const qf = k - 24; // 1–4
    const qfDayOffsets = [0, 0, 2, 2] as const;
    const qfHours = [18, 22, 18, 22] as const;
    const base = Date.UTC(2026, 6, 9);
    return new Date(base + qfDayOffsets[qf - 1] * 86400000 + qfHours[qf - 1] * 3600000);
  } else if (k <= 30) {
    // Semi-finals: July 14 and July 15
    const sf = k - 28; // 1–2
    return new Date(Date.UTC(2026, 6, 13 + sf, 22, 0, 0));
  } else if (k === 31) {
    // Third place: July 18
    return new Date(Date.UTC(2026, 6, 18, 18, 0, 0));
  } else {
    // Final: July 19
    return new Date(Date.UTC(2026, 6, 19, 18, 0, 0));
  }
}

const centerAdminData: Array<{ email: string; centerName: string }> = [
  { email: "antwerpen.noord@garrincha.be", centerName: "GARRINCHA Antwerpen Noord" },
  { email: "antwerpen.zuid@garrincha.be", centerName: "GARRINCHA Antwerpen Zuid" },
  { email: "charleroi.dampremy@garrincha.be", centerName: "GARRINCHA Charleroi Dampremy" },
  { email: "charleroi.montignies@garrincha.be", centerName: "GARRINCHA Charleroi Montignies" },
  { email: "diegem@garrincha.be", centerName: "GARRINCHA Diegem" },
  { email: "gent.arsenaal@garrincha.be", centerName: "GARRINCHA Gent Arsenaal" },
  { email: "gent.theloop@garrincha.be", centerName: "GARRINCHA Gent The Loop" },
  { email: "kortrijk@garrincha.be", centerName: "GARRINCHA Kortrijk" },
  { email: "luik@garrincha.be", centerName: "GARRINCHA Luik" },
  { email: "westgate.dilbeek@garrincha.be", centerName: "GARRINCHA Westgate Dilbeek" },
];

function deriveNickname(centerName: string): string {
  // Strip "GARRINCHA " prefix
  return centerName.replace(/^GARRINCHA\s+/, "");
}

function deriveFullName(email: string): string {
  // Take the local part before @, split on ".", capitalise each word, append "Admin"
  const local = email.split("@")[0];
  const words = local.split(".").map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return `${words.join(" ")} Admin`;
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
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;
  const centerAdminPasswordPlain = process.env.CENTER_ADMIN_PASSWORD;

  if (!ownerPasswordPlain || ownerPasswordPlain.length < 8) {
    throw new Error("OWNER_PASSWORD must be set in .env (minimum 8 characters).");
  }
  if (!adminPasswordPlain || adminPasswordPlain.length < 8) {
    throw new Error("ADMIN_PASSWORD must be set in .env (minimum 8 characters).");
  }
  if (!centerAdminPasswordPlain || centerAdminPasswordPlain.length < 8) {
    throw new Error("CENTER_ADMIN_PASSWORD must be set in .env (minimum 8 characters).");
  }

  const centers = [
    { name: "GARRINCHA Antwerpen Noord", country: "Belgium", city: "Antwerpen" },
    { name: "GARRINCHA Antwerpen Zuid", country: "Belgium", city: "Antwerpen" },
    { name: "GARRINCHA Charleroi Dampremy", country: "Belgium", city: "Charleroi" },
    { name: "GARRINCHA Charleroi Montignies", country: "Belgium", city: "Charleroi" },
    { name: "GARRINCHA Diegem", country: "Belgium", city: "Diegem" },
    { name: "GARRINCHA Gent Arsenaal", country: "Belgium", city: "Gent" },
    { name: "GARRINCHA Gent The Loop", country: "Belgium", city: "Gent" },
    { name: "GARRINCHA Kortrijk", country: "Belgium", city: "Kortrijk" },
    { name: "GARRINCHA Luik", country: "Belgium", city: "Luik" },
    { name: "GARRINCHA Westgate Dilbeek", country: "Belgium", city: "Dilbeek" },
  ];

  for (const center of centers) {
    await prisma.garrinchaCenter.upsert({
      where: { name: center.name },
      create: { ...center, bannerUrl: "/branding/garrincha-banner.svg" },
      update: { ...center, bannerUrl: "/branding/garrincha-banner.svg" },
    });
  }

  const center = await prisma.garrinchaCenter.findFirstOrThrow();
  const ownerPassword = await hash(ownerPasswordPlain, 12);
  await prisma.user.upsert({
    where: { email: ownerEmail },
    create: {
      email: ownerEmail,
      passwordHash: ownerPassword,
      fullName: ownerDisplayName,
      nickname: ownerDisplayName,
      dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
      phoneNumber: "+32000000001",
      displayName: ownerDisplayName,
      nationality: "Belgium",
      role: Role.SUPER_ADMIN,
      centerId: center.id,
    },
    update: {
      passwordHash: ownerPassword,
      displayName: ownerDisplayName,
      role: Role.SUPER_ADMIN,
      centerId: center.id,
    },
  });
  console.log(`Owner account: ${ownerEmail} (${ownerDisplayName})`);


  const adminPassword = await hash(adminPasswordPlain, 12);
  await prisma.user.upsert({
    where: { email: "admin@garrincha.local" },
    create: {
      email: "admin@garrincha.local",
      passwordHash: adminPassword,
      fullName: "GARRINCHA Admin",
      nickname: "Admin",
      dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
      phoneNumber: "+32000000000",
      displayName: "GARRINCHA Admin",
      nationality: "Belgium",
      role: Role.ADMIN,
      centerId: center.id,
    },
    update: {
      passwordHash: adminPassword,
      role: Role.ADMIN,
      centerId: center.id,
    },
  });

  const centerAdminPassword = await hash(centerAdminPasswordPlain, 12);
  for (let i = 0; i < centerAdminData.length; i++) {
    const { email, centerName } = centerAdminData[i];
    const adminCenter = await prisma.garrinchaCenter.findFirstOrThrow({
      where: { name: centerName },
    });
    const nickname = deriveNickname(centerName);
    const fullName = deriveFullName(email);
    const phoneNumber = `+3200000000${(i + 2).toString().padStart(1, "0")}`;
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash: centerAdminPassword,
        fullName,
        nickname,
        dateOfBirth: new Date("1990-01-01T00:00:00.000Z"),
        phoneNumber,
        displayName: nickname,
        nationality: "Belgium",
        role: Role.CENTER_ADMIN,
        centerId: adminCenter.id,
      },
      update: {
        passwordHash: centerAdminPassword,
        role: Role.CENTER_ADMIN,
        centerId: adminCenter.id,
        displayName: nickname,
      },
    });
  }
  console.log("Seeded 10 center admin accounts.");

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

  let matchNo = 1;
  const pairIndexes = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  for (const [groupName, names] of Object.entries(groups)) {
    for (const [homeIndex, awayIndex] of pairIndexes) {
      const home = teams.get(names[homeIndex]);
      const away = teams.get(names[awayIndex]);
      if (!home || !away) throw new Error("Missing group team");
      await prisma.match.upsert({
        where: { fifaMatchNo: matchNo },
        create: {
          fifaMatchNo: matchNo,
          stage: Stage.GROUP,
          venue: venueFor(matchNo),
          kickoffAt: kickoff(matchNo),
          homeTeamId: home.id,
          awayTeamId: away.id,
        },
        update: {
          stage: Stage.GROUP,
          venue: venueFor(matchNo),
          kickoffAt: kickoff(matchNo),
          homeTeamId: home.id,
          awayTeamId: away.id,
        },
      });
      matchNo += 1;
    }
    console.log(`Seeded Group ${groupName}`);
  }

  const knockoutPlan: Array<{ stage: Stage; count: number }> = [
    { stage: Stage.ROUND_OF_32, count: 16 },
    { stage: Stage.ROUND_OF_16, count: 8 },
    { stage: Stage.QUARTER_FINAL, count: 4 },
    { stage: Stage.SEMI_FINAL, count: 2 },
    { stage: Stage.THIRD_PLACE, count: 1 },
    { stage: Stage.FINAL, count: 1 },
  ];

  let placeholder = 1;
  for (const plan of knockoutPlan) {
    for (let index = 0; index < plan.count; index += 1) {
      const home = teams.get(`TBD Slot ${placeholder}`);
      const away = teams.get(`TBD Slot ${placeholder + 1}`);
      if (!home || !away) throw new Error("Missing knockout placeholder");
      await prisma.match.upsert({
        where: { fifaMatchNo: matchNo },
        create: {
          fifaMatchNo: matchNo,
          stage: plan.stage,
          venue: venueFor(matchNo),
          kickoffAt: kickoff(matchNo),
          homeTeamId: home.id,
          awayTeamId: away.id,
        },
        update: {
          stage: plan.stage,
          venue: venueFor(matchNo),
          kickoffAt: kickoff(matchNo),
          homeTeamId: home.id,
          awayTeamId: away.id,
        },
      });
      placeholder += 2;
      matchNo += 1;
    }
  }

  console.log("Seed complete: 104 World Cup match slots, centers, teams, owner account, and admin account.");
  console.log("Schedule note: seeded kickoffAt values are UTC placeholders. Confirm official FIFA match metadata before public launch.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
