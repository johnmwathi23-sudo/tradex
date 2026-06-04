-- Seed Master Traders
-- Run this in Supabase SQL Editor after deploying to Vercel
-- This creates auth users, profiles, and master trader records
-- for Master FX and Flossin.

-- First, create auth users (service_role required)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'masterfx@tradex.com', crypt('MasterFX123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'flossin@tradex.com', crypt('Flossin123!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create profiles for the new auth users
INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
SELECT id, email, 
  CASE WHEN email = 'masterfx@tradex.com' THEN 'Master' ELSE 'Flossin' END,
  CASE WHEN email = 'masterfx@tradex.com' THEN 'FX' ELSE 'Trader' END,
  NOW(), NOW()
FROM auth.users
WHERE email IN ('masterfx@tradex.com', 'flossin@tradex.com')
ON CONFLICT (id) DO NOTHING;

-- Create master trader records
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, is_verified, is_active, created_at, updated_at)
SELECT 
  p.id, 
  'Master FX',
  'Professional forex trader with 12+ years experience. Specializes in EUR/USD and GBP/USD pairs. Consistent returns with strict risk management.',
  47.8, 78.5, 234, 1289, 'medium', 25.00, 50.00, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p
WHERE p.email = 'masterfx@tradex.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, is_verified, is_active, created_at, updated_at)
SELECT 
  p.id, 
  'Flossin',
  'Crypto and indices specialist. 8 years trading BTC, ETH, and NASDAQ. High-conviction swing trader with low drawdown.',
  32.4, 82.1, 156, 847, 'low', 20.00, 25.00, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p
WHERE p.email = 'flossin@tradex.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- Verify the data
SELECT mt.display_name, mt.roi, mt.win_rate, mt.total_followers, mt.total_trades, mt.risk_level, mt.is_verified
FROM public.master_traders mt
ORDER BY mt.created_at;
