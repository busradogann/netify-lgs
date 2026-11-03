-- Add Pro membership flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;
