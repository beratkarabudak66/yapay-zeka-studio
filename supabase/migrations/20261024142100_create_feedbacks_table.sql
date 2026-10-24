/*
# Create feedbacks table for contact form

1. New Tables
- `feedbacks`
  - `id` (uuid, primary key)
  - `name` (text, not null) — sender's name
  - `email` (text, not null) — sender's email
  - `subject` (text, not null) — message subject
  - `message` (text, not null) — message body
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `feedbacks`.
- Grant SELECT, INSERT to `anon, authenticated` so the no-auth frontend can submit and read feedbacks.
- Grant DELETE to `anon, authenticated` so admin can remove feedbacks.
- All policies use `USING (true)` / `WITH CHECK (true)` because this is a single-tenant no-auth app where feedbacks are intentionally public/shared.
*/

CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON feedbacks TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_feedbacks" ON feedbacks;
CREATE POLICY "anon_select_feedbacks" ON feedbacks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_feedbacks" ON feedbacks;
CREATE POLICY "anon_insert_feedbacks" ON feedbacks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_feedbacks" ON feedbacks;
CREATE POLICY "anon_delete_feedbacks" ON feedbacks FOR DELETE
  TO anon, authenticated USING (true);
