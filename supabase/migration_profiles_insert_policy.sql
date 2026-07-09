-- Fix: Add INSERT policy for profiles table
-- Without this, newly registered users cannot create their profile row

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Backfill profiles for auth users who registered before the INSERT policy existed
-- Note: The on_profile_created trigger will fire for each new profile, creating accounts.
-- Deduplicate existing accounts first to avoid duplicates from the trigger.
DELETE FROM public.accounts a
USING public.accounts b
WHERE a.id < b.id AND a.user_id = b.user_id;

INSERT INTO public.profiles (id, email, first_name, last_name, created_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
