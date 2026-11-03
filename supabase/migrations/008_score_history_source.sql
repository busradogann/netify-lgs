ALTER TABLE public.score_history ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
