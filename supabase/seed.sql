-- ==============================================================================
-- FormaTech Seed Data: Topics and Initial Setup
-- ==============================================================================

-- 1. Insert initial three event topics (Forma Tak exhibition courses)
INSERT INTO public.topics (slug, position, is_active)
VALUES
    ('topic-a', 1, true),
    ('topic-b', 2, true),
    ('topic-c', 3, true)
ON CONFLICT (slug) DO UPDATE
SET position = EXCLUDED.position,
    is_active = EXCLUDED.is_active;

-- ==============================================================================
-- HOW TO CREATE THE FIRST ADMIN USER
-- ==============================================================================
-- Step 1: Create an administrative user in Supabase Auth.
-- Option A (via Supabase Studio Dashboard):
--   1. Go to "Authentication" -> "Users" -> "Add User" -> "Create User"
--   2. Enter the admin email (e.g. admin@formatech.dz) and a strong password.
--   3. Confirm user creation.
--   4. Copy the generated User UID (e.g., 'a1b2c3d4-e5f6-7890-abcd-ef1234567890').
--
-- Option B (via SQL Editor in Supabase):
--   Run the following query with your desired admin credentials:
--
--   DO $$
--   DECLARE
--     new_user_id UUID := gen_random_uuid();
--   BEGIN
--     -- Insert into auth.users (Supabase Auth internal)
--     INSERT INTO auth.users (
--       instance_id,
--       id,
--       aud,
--       role,
--       email,
--       encrypted_password,
--       email_confirmed_at,
--       raw_app_meta_data,
--       raw_user_meta_data,
--       created_at,
--       updated_at
--     )
--     VALUES (
--       '00000000-0000-00-0000-000000000000',
--       new_user_id,
--       'authenticated',
--       'authenticated',
--       'admin@formatech.dz',
--       crypt('AdminSecurePass2026!', gen_salt('bf')),
--       now(),
--       '{"provider":"email","providers":["email"]}',
--       '{"full_name":"FormaTech Lead Admin"}',
--       now(),
--       now()
--     );
--
--     -- Add to the FormaTech admins allowlist
--     INSERT INTO public.admins (user_id)
--     VALUES (new_user_id);
--   END $$;
--
-- Step 2: If created via Dashboard (Option A), authorize the user UID into public.admins:
--   INSERT INTO public.admins (user_id)
--   VALUES ('<PASTE-YOUR-COPIED-USER-UID-HERE>')
--   ON CONFLICT (user_id) DO NOTHING;
-- ==============================================================================
