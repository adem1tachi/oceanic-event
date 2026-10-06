-- Migration: Add site_analytics table for traffic & official website outbound click tracking

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

-- Enable Row Level Security
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated visitors to insert tracking events
CREATE POLICY "Allow public insert to site_analytics"
    ON public.site_analytics FOR INSERT
    WITH CHECK (true);

-- Allow admins full access / select
CREATE POLICY "Allow admins select on site_analytics"
    ON public.site_analytics FOR SELECT
    USING (public.is_admin());

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.site_analytics TO anon, authenticated;
GRANT SELECT ON public.site_analytics TO authenticated;
