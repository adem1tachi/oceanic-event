-- Add UI settings to DB

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_registration_open BOOLEAN NOT NULL DEFAULT true,
    event_date TIMESTAMPTZ NULL,
    contact_statuses JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row if not exists
INSERT INTO public.app_settings (id, is_registration_open) VALUES (1, true) ON CONFLICT (id) DO NOTHING;

-- 2. Add columns to Topics
ALTER TABLE public.topics
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. RLS for App Settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read app settings"
    ON public.app_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage app settings"
    ON public.app_settings FOR ALL
    USING (public.is_admin());

GRANT SELECT ON public.app_settings TO anon, authenticated;
