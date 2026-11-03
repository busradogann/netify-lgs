-- Add program and language columns to schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS program text;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS language text;

-- Increase score precision (MEB uses 4 decimal places)
ALTER TABLE public.placement_scores ALTER COLUMN min_score TYPE numeric(8,4);

-- Drop old unique constraint and add new one with program
ALTER TABLE public.placement_scores DROP CONSTRAINT IF EXISTS placement_scores_school_id_year_key;

-- Allow multiple programs per school (different language/program combinations)
-- Each has its own placement score per year

-- Clear old seed data
DELETE FROM public.placement_scores;
DELETE FROM public.favorites;
DELETE FROM public.schools;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_type ON public.schools(type);
CREATE INDEX IF NOT EXISTS idx_schools_name ON public.schools(name);

-- Allow anon users to insert schools and scores (for bulk import script)
CREATE POLICY "Anon can insert schools" ON public.schools FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert scores" ON public.placement_scores FOR INSERT WITH CHECK (true);
