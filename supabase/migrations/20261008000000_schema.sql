-- ==============================================================================
-- OCEANIC x Formatech: Consolidated Production Database Schema
-- All valid tables, indexes, security policies, and default settings
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Participants Table (Registered Visitors)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NULL,
    position TEXT NULL,
    company TEXT NULL,
    desired_topic TEXT NULL,
    people_count INTEGER DEFAULT 1,
    consent BOOLEAN NOT NULL DEFAULT true,
    locale TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT participants_full_name_check CHECK (char_length(trim(full_name)) >= 2),
    CONSTRAINT participants_phone_check CHECK (char_length(trim(phone)) >= 9),
    CONSTRAINT participants_consent_check CHECK (consent = true)
);

CREATE INDEX IF NOT EXISTS idx_participants_created_at ON public.participants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_phone ON public.participants(phone);
CREATE INDEX IF NOT EXISTS idx_participants_company ON public.participants(company);

-- ==============================================================================
-- 2. Winners Table (Raffle Draw Winners)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE,
    draw_round INTEGER NOT NULL DEFAULT 1,
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_winners_round ON public.winners(draw_round);
CREATE INDEX IF NOT EXISTS idx_winners_drawn_at ON public.winners(drawn_at DESC);

-- ==============================================================================
-- 3. Admins Allowlist Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. App Settings Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_registration_open BOOLEAN NOT NULL DEFAULT true,
    event_date TIMESTAMPTZ NULL,
    contact_statuses JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT single_row CHECK (id = 1)
);

-- ==============================================================================
-- 5. Site Analytics Table (Traffic & Outbound Clicks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'page_view' | 'link_click'
    visitor_id TEXT NOT NULL,
    session_id TEXT NULL,
    url TEXT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON public.site_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_site_analytics_visitor_id ON public.site_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON public.site_analytics(created_at DESC);

-- ==============================================================================
-- 6. Helper Functions & Stored Procedures
-- ==============================================================================

-- Admin Verification Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT (
        auth.role() = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
        OR (auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.admins WHERE user_id = auth.uid()
        ))
    );
$$;

-- Atomic Raffle Draw Procedure
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

-- Raffle Reset Procedure
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

-- ==============================================================================
-- 7. Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Admins can view participants"
    ON public.participants FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage participants"
    ON public.participants FOR ALL
    USING (public.is_admin());

-- Winners policies
CREATE POLICY "Admins can view winners"
    ON public.winners FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage winners"
    ON public.winners FOR ALL
    USING (public.is_admin());

-- Admins policies
CREATE POLICY "Admins can view admins"
    ON public.admins FOR SELECT
    USING (public.is_admin());

-- App Settings policies
CREATE POLICY "Public can read app settings"
    ON public.app_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage app settings"
    ON public.app_settings FOR ALL
    USING (public.is_admin());

-- Site Analytics policies
CREATE POLICY "Admins can view site_analytics"
    ON public.site_analytics FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage site_analytics"
    ON public.site_analytics FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 8. Schema Permissions & Grants
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public access (Read-only for app settings)
GRANT SELECT ON public.app_settings TO anon, authenticated;

-- Service role & authenticated access
GRANT ALL ON public.participants TO authenticated, service_role;
GRANT ALL ON public.winners TO authenticated, service_role;
GRANT ALL ON public.admins TO authenticated, service_role;
GRANT ALL ON public.app_settings TO authenticated, service_role;
GRANT ALL ON public.site_analytics TO authenticated, service_role;

-- ==============================================================================
-- 9. Default Configuration Seed (الاعدادات الافتراضية)
-- ==============================================================================
INSERT INTO public.app_settings (id, is_registration_open, event_date, contact_statuses)
VALUES (1, true, NULL, '{}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET is_registration_open = EXCLUDED.is_registration_open;

-- ==============================================================================
-- 10. First Admin User Authorization Guide (Optional)
-- Run this after creating your admin user in Supabase Authentication:
-- 
-- INSERT INTO public.admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com'
-- ON CONFLICT (user_id) DO NOTHING;
-- ==============================================================================
