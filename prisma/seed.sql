-- Add initial rooms to the database
-- Run this in your Supabase SQL editor or using psql

INSERT INTO "Room" (id, name, slug, "coverImage", "createdAt")
VALUES 
  (gen_random_uuid()::text, 'Our First Date', 'our-first-date', NULL, NOW()),
  (gen_random_uuid()::text, 'El Ain El Sokhna Trip 2025', 'el-ain-el-sokhna-trip-2025', NULL, NOW()),
  (gen_random_uuid()::text, 'Ain El Sokhna Trip 2025', 'ain-el-sokhna-trip-2025', NULL, NOW())
ON CONFLICT (slug) DO NOTHING;
