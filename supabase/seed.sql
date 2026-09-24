-- Seed Topics
INSERT INTO public.topics (slug, position, is_active)
VALUES
    ('topic-a', 1, true),
    ('topic-b', 2, true),
    ('topic-c', 3, true)
ON CONFLICT (slug) DO UPDATE
SET position = EXCLUDED.position,
    is_active = EXCLUDED.is_active;

-- Sample Initial Votes (Optional seed for previewing results)
INSERT INTO public.votes (topic_id)
SELECT id FROM public.topics WHERE slug = 'topic-a' LIMIT 1;
INSERT INTO public.votes (topic_id)
SELECT id FROM public.topics WHERE slug = 'topic-a' LIMIT 1;
INSERT INTO public.votes (topic_id)
SELECT id FROM public.topics WHERE slug = 'topic-b' LIMIT 1;

-- To authorize an admin after creating them in Supabase Auth Dashboard:
-- INSERT INTO public.admins (user_id) VALUES ('<USER_UUID_FROM_AUTH>');
