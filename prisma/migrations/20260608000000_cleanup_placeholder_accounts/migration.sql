-- Migration: Remove placeholder admin accounts and legacy centers.
-- Targets ONLY explicitly seeded demo/placeholder records.
-- Real player accounts (role=USER) are NOT touched.

-- 1. Remove fake center-admin accounts (seeded @garrincha.be addresses)
DELETE FROM "User"
WHERE email IN (
  'antwerpen.noord@garrincha.be',
  'antwerpen.zuid@garrincha.be',
  'charleroi.dampremy@garrincha.be',
  'charleroi.montignies@garrincha.be',
  'diegem@garrincha.be',
  'gent.arsenaal@garrincha.be',
  'gent.theloop@garrincha.be',
  'kortrijk@garrincha.be',
  'luik@garrincha.be',
  'westgate.dilbeek@garrincha.be'
);

-- 2. Remove local-only admin account
DELETE FROM "User" WHERE email = 'admin@garrincha.local';

-- 3. Clear fake phone numbers on the owner account only
--    (pattern: +320000000xx — only targeting the seeded placeholder series)
UPDATE "User"
SET "phoneNumber" = ''
WHERE "phoneNumber" ~ '^\+320{7,8}\d{1,2}$'
  AND role IN ('SUPER_ADMIN', 'ADMIN', 'CENTER_ADMIN');

-- 4. Ensure Head Quarter center exists
INSERT INTO "GarrinchaCenter" ("id", "name", "country", "city", "bannerUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Head Quarter', 'Belgium', 'Brussels', NULL, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- 5. Reassign the owner (wc.garrincha@gmail.com) to Head Quarter
UPDATE "User"
SET "centerId" = (
  SELECT "id" FROM "GarrinchaCenter" WHERE "name" = 'Head Quarter' LIMIT 1
)
WHERE email = 'wc.garrincha@gmail.com';

-- 6. Remove legacy placeholder centers that have no remaining users
--    Safe: only deletes if centerId is not referenced by any User row.
DELETE FROM "GarrinchaCenter"
WHERE name IN (
  'GARRINCHA Antwerpen Noord',
  'GARRINCHA Antwerpen Zuid',
  'GARRINCHA Charleroi Dampremy',
  'GARRINCHA Charleroi Montignies',
  'GARRINCHA Diegem',
  'GARRINCHA Gent Arsenaal',
  'GARRINCHA Gent The Loop',
  'GARRINCHA Kortrijk',
  'GARRINCHA Luik',
  'GARRINCHA Westgate Dilbeek'
)
AND NOT EXISTS (
  SELECT 1 FROM "User" WHERE "centerId" = "GarrinchaCenter"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "User" WHERE "competitionCenterId" = "GarrinchaCenter"."id"
);
