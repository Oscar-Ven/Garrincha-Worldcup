-- Ensure all 10 GARRINCHA competition centers + Head Quarter exist.
-- Safe to run multiple times: ON CONFLICT (name) DO NOTHING skips existing rows.

INSERT INTO "GarrinchaCenter" ("id", "name", "country", "city", "bannerUrl", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Head Quarter',                   'Belgium', 'Brussels',  NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Antwerpen Noord',      'Belgium', 'Antwerpen', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Antwerpen Zuid',       'Belgium', 'Antwerpen', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Charleroi Dampremy',   'Belgium', 'Charleroi', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Charleroi Montignies', 'Belgium', 'Charleroi', NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Diegem',               'Belgium', 'Diegem',    NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Gent Arsenaal',        'Belgium', 'Gent',      NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Gent The Loop',        'Belgium', 'Gent',      NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Kortrijk',             'Belgium', 'Kortrijk',  NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Luik',                 'Belgium', 'Luik',      NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'GARRINCHA Westgate Dilbeek',     'Belgium', 'Dilbeek',   NULL, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
