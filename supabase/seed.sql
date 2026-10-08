-- ==============================================================================
-- OCEANIC x Formatech: Initial Seed Data
-- Default App Settings (Zero Mock Participants)
-- ==============================================================================

-- 1. Ensure default app settings row exists
INSERT INTO public.app_settings (id, is_registration_open, event_date, contact_statuses)
VALUES (1, true, NULL, '{}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET is_registration_open = EXCLUDED.is_registration_open;

-- 2. First Admin User Authorization Guide (Optional)
-- To authorize an admin user after creating them in Supabase Auth (Authentication -> Users):
-- 
-- INSERT INTO public.admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com'
-- ON CONFLICT (user_id) DO NOTHING;
