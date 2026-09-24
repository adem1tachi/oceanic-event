-- ==============================================================================
-- FormaTech Seed Data: Topics, Sample Votes, and Mock Participants
-- ==============================================================================

-- 1. Seed Topics
INSERT INTO public.topics (slug, position, is_active)
VALUES
    ('topic-a', 1, true),
    ('topic-b', 2, true),
    ('topic-c', 3, true)
ON CONFLICT (slug) DO UPDATE
SET position = EXCLUDED.position,
    is_active = EXCLUDED.is_active;

-- 2. Sample Initial Votes (Optional seed for previewing live results)
INSERT INTO public.votes (topic_id)
SELECT id FROM public.topics WHERE slug = 'topic-a' LIMIT 1;
INSERT INTO public.votes (topic_id)
SELECT id FROM public.topics WHERE slug = 'topic-a' LIMIT 1;
INSERT INTO public.votes (topic_id)
SELECT id FROM public.topics WHERE slug = 'topic-b' LIMIT 1;

-- 3. Mock Participants for Testing (Algerian names, canonical E.164 phones, and locales)
INSERT INTO public.participants (full_name, phone, email, consent, locale, created_at)
VALUES
    ('كريم بلقاسم', '+213550112233', 'karim.belkacem@example.dz', true, 'ar', now() - interval '2 hours'),
    ('أمينة حداد', '+213770223344', 'amina.haddad@example.dz', true, 'ar', now() - interval '1 hour 45 minutes'),
    ('Yacine Brahimi', '+213661334455', 'yacine.b@example.com', true, 'en', now() - interval '1 hour 30 minutes'),
    ('فاطمة الزهراء بن علي', '+213552445566', 'fatima.benali@example.dz', true, 'ar', now() - interval '1 hour 15 minutes'),
    ('Riyad Mansouri', '+213771556677', 'riyad.m@example.com', true, 'en', now() - interval '1 hour'),
    ('سفيان قادري', '+213660667788', NULL, true, 'ar', now() - interval '50 minutes'),
    ('Meriem Saidi', '+213554778899', 'meriem.saidi@example.dz', true, 'en', now() - interval '40 minutes'),
    ('حمزة دراجي', '+213772889900', 'hamza.d@example.dz', true, 'ar', now() - interval '35 minutes'),
    ('Ines Boukhalfa', '+213662990011', 'ines.b@example.com', true, 'en', now() - interval '25 minutes'),
    ('طارق مدني', '+213550001122', 'tarek.madani@example.dz', true, 'ar', now() - interval '20 minutes'),
    ('سارة عماري', '+213774112233', NULL, true, 'ar', now() - interval '15 minutes'),
    ('Nadir Benaissa', '+213665223344', 'nadir.b@example.com', true, 'en', now() - interval '10 minutes'),
    ('ليلى بوزيد', '+213556334455', 'leila.bouzid@example.dz', true, 'ar', now() - interval '8 minutes'),
    ('Samir Hamidi', '+213775445566', 'samir.h@example.com', true, 'en', now() - interval '5 minutes'),
    ('أسامة خليل', '+213667556677', 'oussama.k@example.dz', true, 'ar', now() - interval '2 minutes')
ON CONFLICT (phone) DO NOTHING;

-- 4. To authorize your admin user:
-- INSERT INTO public.admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'admin@example1.com'
-- ON CONFLICT (user_id) DO NOTHING;
