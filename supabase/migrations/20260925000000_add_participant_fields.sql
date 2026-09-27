-- ==============================================================================
-- FormaTech Migration: Add Extended Visitor Profile Fields
-- ==============================================================================

ALTER TABLE public.participants
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS position TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS desired_topic TEXT,
    ADD COLUMN IF NOT EXISTS people_count INTEGER DEFAULT 1;

-- Optional index on company and position for event analytics
CREATE INDEX IF NOT EXISTS idx_participants_company ON public.participants(company);
