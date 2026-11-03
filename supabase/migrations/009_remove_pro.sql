-- Remove Pro membership flag from profiles (no longer used)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_pro;
