/*
# Food Verse AI — core schema

1. New Tables
- `profile` — single nutrition profile (allergies, goals, dietary prefs). Single-tenant.
- `scans` — food recognition & freshness analysis results (image ref, category, payload, scores).
- `hygiene_reports` — restaurant hygiene monitoring reports.
- `cooking_sessions` — smart cooking assistant sessions with step-by-step guidance.
- `nutrition_logs` — daily nutrition intake entries tied to the profile.

2. Security
- Single-tenant app (no sign-in). All tables use `TO anon, authenticated` with `USING (true)` so the anon-key frontend can read/write its own shared data.
- RLS enabled on every table.

3. Notes
- `payload` / `results` columns are jsonb to allow flexible, evolving analysis output per module.
- `image_ref` stores either a Pexels placeholder URL or a data-URL thumbnail for uploaded images.
*/

CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'You',
  age int,
  weight_kg numeric,
  height_cm numeric,
  activity_level text DEFAULT 'moderate',
  goal text DEFAULT 'maintain',
  dietary_prefs text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  daily_calorie_target int DEFAULT 2200,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profile" ON profile;
CREATE POLICY "anon_select_profile" ON profile FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profile" ON profile;
CREATE POLICY "anon_insert_profile" ON profile FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profile" ON profile;
CREATE POLICY "anon_update_profile" ON profile FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profile" ON profile;
CREATE POLICY "anon_delete_profile" ON profile FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('recognition','freshness')),
  image_ref text,
  image_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric,
  score numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_scans" ON scans;
CREATE POLICY "anon_select_scans" ON scans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_scans" ON scans;
CREATE POLICY "anon_insert_scans" ON scans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_scans" ON scans;
CREATE POLICY "anon_update_scans" ON scans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_scans" ON scans;
CREATE POLICY "anon_delete_scans" ON scans FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at DESC);
CREATE INDEX IF NOT EXISTS scans_category_idx ON scans (category);

CREATE TABLE IF NOT EXISTS hygiene_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name text NOT NULL,
  image_ref text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score numeric,
  grade text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hygiene_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_hygiene" ON hygiene_reports;
CREATE POLICY "anon_select_hygiene" ON hygiene_reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_hygiene" ON hygiene_reports;
CREATE POLICY "anon_insert_hygiene" ON hygiene_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_hygiene" ON hygiene_reports;
CREATE POLICY "anon_update_hygiene" ON hygiene_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_hygiene" ON hygiene_reports;
CREATE POLICY "anon_delete_hygiene" ON hygiene_reports FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS cooking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_cooking" ON cooking_sessions;
CREATE POLICY "anon_select_cooking" ON cooking_sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cooking" ON cooking_sessions;
CREATE POLICY "anon_insert_cooking" ON cooking_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cooking" ON cooking_sessions;
CREATE POLICY "anon_update_cooking" ON cooking_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cooking" ON cooking_sessions;
CREATE POLICY "anon_delete_cooking" ON cooking_sessions FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  meal text,
  item text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric DEFAULT 0,
  carbs_g numeric DEFAULT 0,
  fat_g numeric DEFAULT 0,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_nutrition" ON nutrition_logs;
CREATE POLICY "anon_select_nutrition" ON nutrition_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_nutrition" ON nutrition_logs;
CREATE POLICY "anon_insert_nutrition" ON nutrition_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_nutrition" ON nutrition_logs;
CREATE POLICY "anon_update_nutrition" ON nutrition_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_nutrition" ON nutrition_logs;
CREATE POLICY "anon_delete_nutrition" ON nutrition_logs FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS nutrition_log_date_idx ON nutrition_logs (log_date DESC);
