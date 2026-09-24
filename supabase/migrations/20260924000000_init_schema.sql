-- FormaTech Core Database Schema Migration
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    position INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    device_id TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_votes_topic_id ON public.votes(topic_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON public.votes(created_at DESC);

-- 3. Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NULL,
    consent BOOLEAN NOT NULL DEFAULT true,
    locale TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT participants_full_name_check CHECK (char_length(trim(full_name)) >= 2),
    CONSTRAINT participants_phone_check CHECK (char_length(trim(phone)) >= 9),
    CONSTRAINT participants_consent_check CHECK (consent = true)
);

CREATE INDEX IF NOT EXISTS idx_participants_created_at ON public.participants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_phone ON public.participants(phone);

-- 4. Winners Table
CREATE TABLE IF NOT EXISTS public.winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE,
    draw_round INTEGER NOT NULL DEFAULT 1,
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_winners_round ON public.winners(draw_round);
CREATE INDEX IF NOT EXISTS idx_winners_drawn_at ON public.winners(drawn_at DESC);

-- 5. Admins Allowlist Table
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Admin Verification Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    );
$$;

-- 7. Public Results View
CREATE OR REPLACE VIEW public.vote_counts AS
SELECT 
    t.id AS topic_id,
    t.slug AS topic_slug,
    t.position AS topic_position,
    COUNT(v.id)::BIGINT AS count
FROM public.topics t
LEFT JOIN public.votes v ON t.id = v.topic_id
WHERE t.is_active = true
GROUP BY t.id, t.slug, t.position;

-- 8. Raffle Draw Stored Procedure
CREATE OR REPLACE FUNCTION public.draw_winners(n INT)
RETURNS TABLE (
    id UUID,
    participant_id UUID,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    locale TEXT,
    draw_round INT,
    drawn_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_round INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller is not in admins allowlist';
    END IF;

    IF n IS NULL OR n <= 0 THEN
        RAISE EXCEPTION 'Invalid winner count: must be greater than zero';
    END IF;

    SELECT COALESCE(MAX(w.draw_round), 0) + 1 INTO next_round FROM public.winners w;

    RETURN QUERY
    WITH eligible AS (
        SELECT p.id AS p_id
        FROM public.participants p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.winners w WHERE w.participant_id = p.id
        )
        ORDER BY random()
        LIMIT n
    ),
    inserted AS (
        INSERT INTO public.winners (participant_id, draw_round, drawn_at)
        SELECT p_id, next_round, now()
        FROM eligible
        RETURNING winners.id, winners.participant_id, winners.draw_round, winners.drawn_at
    )
    SELECT 
        ins.id,
        ins.participant_id,
        p.full_name,
        p.phone,
        p.email,
        p.locale,
        ins.draw_round,
        ins.drawn_at
    FROM inserted ins
    JOIN public.participants p ON ins.participant_id = p.id
    ORDER BY ins.drawn_at ASC;
END;
$$;

-- 9. Raffle Reset Stored Procedure
CREATE OR REPLACE FUNCTION public.reset_draw()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: caller is not in admins allowlist';
    END IF;

    TRUNCATE TABLE public.winners;
END;
$$;

-- 10. Row Level Security Policies
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active topics"
    ON public.topics FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins have full access to topics"
    ON public.topics FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can insert votes"
    ON public.votes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view votes"
    ON public.votes FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can view participants"
    ON public.participants FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage participants"
    ON public.participants FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can view winners"
    ON public.winners FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage winners"
    ON public.winners FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can view admins"
    ON public.admins FOR SELECT
    USING (public.is_admin());

-- 11. Permissions Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.topics TO anon, authenticated;
GRANT SELECT ON public.vote_counts TO anon, authenticated;
GRANT INSERT ON public.votes TO anon, authenticated;
