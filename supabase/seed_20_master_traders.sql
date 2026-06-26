-- Seed 20 Master Traders
-- Run this in Supabase SQL Editor after the display_order migration
-- This creates auth users, profiles, and master trader records.
-- Flossin is ranked #3 with low risk and high rating.
-- Also removes max_drawdown column from copy_trade_subscriptions.

-- 1. Remove max_drawdown column
ALTER TABLE public.copy_trade_subscriptions DROP COLUMN IF EXISTS max_drawdown;

-- 2. Create auth users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'masterfx@primestone.com', crypt('MasterFX123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'alphapro@primestone.com', crypt('AlphaPro123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'flossin@primestone.com', crypt('Flossin123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'fxpulse@primestone.com', crypt('Fxpulse123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'capitalvault@primestone.com', crypt('CapitalVault123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'forexking@primestone.com', crypt('ForexKing123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'cryptomaster@primestone.com', crypt('CryptoMaster123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'swiftrade@primestone.com', crypt('SwifTrade123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'goldenbull@primestone.com', crypt('GoldenBull123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'pipsniper@primestone.com', crypt('PipSniper123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'fxelite@primestone.com', crypt('FxElite123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'tradeprophet@primestone.com', crypt('TradeProphet123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'marketwizard@primestone.com', crypt('MarketWizard123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'quantumfx@primestone.com', crypt('QuantumFx123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'scalperpro@primestone.com', crypt('ScalperPro123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'forexsignal@primestone.com', crypt('ForexSignal123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'bullmarket@primestone.com', crypt('BullMarket123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'fxanalyst@primestone.com', crypt('FxAnalyst123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'tradestorm@primestone.com', crypt('TradeStorm123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  (gen_random_uuid(), 'cryptofx@primestone.com', crypt('CryptoFx123!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. Create profiles for the new auth users
INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
SELECT id, email, 
  CASE 
    WHEN email = 'masterfx@primestone.com' THEN 'Master'
    WHEN email = 'alphapro@primestone.com' THEN 'Alpha'
    WHEN email = 'flossin@primestone.com' THEN 'Flossin'
    WHEN email = 'fxpulse@primestone.com' THEN 'FX'
    WHEN email = 'capitalvault@primestone.com' THEN 'Capital'
    WHEN email = 'forexking@primestone.com' THEN 'Forex'
    WHEN email = 'cryptomaster@primestone.com' THEN 'Crypto'
    WHEN email = 'swiftrade@primestone.com' THEN 'Swift'
    WHEN email = 'goldenbull@primestone.com' THEN 'Golden'
    WHEN email = 'pipsniper@primestone.com' THEN 'Pip'
    WHEN email = 'fxelite@primestone.com' THEN 'FX'
    WHEN email = 'tradeprophet@primestone.com' THEN 'Trade'
    WHEN email = 'marketwizard@primestone.com' THEN 'Market'
    WHEN email = 'quantumfx@primestone.com' THEN 'Quantum'
    WHEN email = 'scalperpro@primestone.com' THEN 'Scalper'
    WHEN email = 'forexsignal@primestone.com' THEN 'Forex'
    WHEN email = 'bullmarket@primestone.com' THEN 'Bull'
    WHEN email = 'fxanalyst@primestone.com' THEN 'FX'
    WHEN email = 'tradestorm@primestone.com' THEN 'Trade'
    WHEN email = 'cryptofx@primestone.com' THEN 'Crypto'
  END,
  CASE 
    WHEN email = 'masterfx@primestone.com' THEN 'FX'
    WHEN email = 'alphapro@primestone.com' THEN 'Pro'
    WHEN email = 'flossin@primestone.com' THEN 'Trader'
    WHEN email = 'fxpulse@primestone.com' THEN 'Pulse'
    WHEN email = 'capitalvault@primestone.com' THEN 'Vault'
    WHEN email = 'forexking@primestone.com' THEN 'King'
    WHEN email = 'cryptomaster@primestone.com' THEN 'Master'
    WHEN email = 'swiftrade@primestone.com' THEN 'Trade'
    WHEN email = 'goldenbull@primestone.com' THEN 'Bull'
    WHEN email = 'pipsniper@primestone.com' THEN 'Sniper'
    WHEN email = 'fxelite@primestone.com' THEN 'Elite'
    WHEN email = 'tradeprophet@primestone.com' THEN 'Prophet'
    WHEN email = 'marketwizard@primestone.com' THEN 'Wizard'
    WHEN email = 'quantumfx@primestone.com' THEN 'Fx'
    WHEN email = 'scalperpro@primestone.com' THEN 'Pro'
    WHEN email = 'forexsignal@primestone.com' THEN 'Signal'
    WHEN email = 'bullmarket@primestone.com' THEN 'Market'
    WHEN email = 'fxanalyst@primestone.com' THEN 'Analyst'
    WHEN email = 'tradestorm@primestone.com' THEN 'Storm'
    WHEN email = 'cryptofx@primestone.com' THEN 'Fx'
  END,
  NOW(), NOW()
FROM auth.users
WHERE email IN ('masterfx@primestone.com', 'alphapro@primestone.com', 'flossin@primestone.com', 'fxpulse@primestone.com', 'capitalvault@primestone.com', 'forexking@primestone.com', 'cryptomaster@primestone.com', 'swiftrade@primestone.com', 'goldenbull@primestone.com', 'pipsniper@primestone.com', 'fxelite@primestone.com', 'tradeprophet@primestone.com', 'marketwizard@primestone.com', 'quantumfx@primestone.com', 'scalperpro@primestone.com', 'forexsignal@primestone.com', 'bullmarket@primestone.com', 'fxanalyst@primestone.com', 'tradestorm@primestone.com', 'cryptofx@primestone.com')
ON CONFLICT (id) DO NOTHING;

-- 4. Create master trader records
-- #1 - Master FX (Medium Risk, Most Followers)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'Master FX', 'Professional forex trader with 12+ years experience. Specializes in EUR/USD and GBP/USD pairs. Consistent returns with strict risk management.', 47.8, 78.5, 234, 1289, 'medium', 25.00, 50.00, 1, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'masterfx@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #2 - AlphaPro (High Risk, Highest ROI)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'AlphaPro', 'Aggressive forex and crypto trader. 10 years of market experience. Known for high-conviction trades on GBP/JPY and BTC with exceptional returns.', 56.2, 71.3, 189, 1567, 'high', 30.00, 100.00, 2, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'alphapro@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #3 - Flossin (Low Risk, High Rating)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'Flossin', 'Multi-market expert trading forex, crypto, and indices. Specializes in EUR/USD, GBP/USD, and NASDAQ. Consistent returns with low-risk approach.', 32.4, 82.1, 156, 847, 'low', 20.00, 25.00, 3, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'flossin@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #4 - FXPulse (Medium Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'FXPulse', 'Momentum trader focused on forex majors. 7 years experience reading market flow and capturing breakout moves on EUR/USD and USD/JPY.', 28.9, 76.8, 134, 1023, 'medium', 22.00, 30.00, 4, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'fxpulse@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #5 - CapitalVault (Low Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'CapitalVault', 'Capital preservation specialist. 15 years trading with a focus on steady growth. Trades indices and major forex pairs with tight risk controls.', 18.5, 85.3, 198, 2341, 'low', 15.00, 200.00, 5, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'capitalvault@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #6 - ForexKing (High Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'ForexKing', 'High-stakes forex trader specializing in exotic pairs. 9 years of experience. Known for bold strategies on USD/TRY and USD/ZAR with massive returns.', 44.1, 65.2, 112, 892, 'high', 35.00, 150.00, 6, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'forexking@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #7 - CryptoMaster (Medium Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'CryptoMaster', 'Crypto market specialist. 6 years trading Bitcoin, Ethereum, and altcoins. Combines technical analysis with on-chain data for high-probability entries.', 52.3, 72.1, 267, 1560, 'medium', 25.00, 50.00, 7, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'cryptomaster@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #8 - SwifTrade (Low Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'SwifTrade', 'Algorithmic trader leveraging quantitative models. 8 years building automated strategies for forex and indices. Low drawdown with consistent monthly returns.', 22.7, 80.4, 145, 678, 'low', 18.00, 75.00, 8, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'swiftrade@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #9 - GoldenBull (Medium Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'GoldenBull', 'Precious metals and commodities expert. 11 years trading gold, silver, and oil. Specializes in XAU/USD with a deep understanding of macro drivers.', 35.6, 74.9, 178, 1134, 'medium', 22.00, 100.00, 9, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'goldenbull@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #10 - PipSniper (High Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'PipSniper', 'Day trader specializing in short-term forex scalping. 5 years of intensive screen time. Executes 50+ trades daily on EUR/USD and GBP/USD.', 41.2, 68.7, 98, 3456, 'high', 30.00, 25.00, 10, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'pipsniper@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #11 - FXElite (Low Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'FXElite', 'Institutional forex trader with 14 years experience. Former bank trader. Focuses on major pairs with institutional-grade risk management.', 26.3, 83.6, 212, 1890, 'low', 20.00, 150.00, 11, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'fxelite@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #12 - TradeProphet (Medium Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'TradeProphet', 'Forex and indices analyst with 13 years of market experience. Uses proprietary technical analysis framework. Known for accurate EUR/USD and S&P 500 calls.', 38.9, 75.2, 167, 1456, 'medium', 25.00, 80.00, 12, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'tradeprophet@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #13 - MarketWizard (Low Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'MarketWizard', 'Multi-asset portfolio manager. 16 years trading forex, commodities, and indices. Conservative approach with emphasis on capital preservation and steady growth.', 20.1, 86.7, 223, 2100, 'low', 15.00, 250.00, 13, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'marketwizard@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #14 - QuantumFx (High Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'QuantumFx', 'Quantitative trader using AI-driven models. 7 years developing machine learning strategies for forex markets. High-reward approach on EUR/USD and USD/JPY.', 48.7, 66.4, 89, 723, 'high', 35.00, 200.00, 14, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'quantumfx@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #15 - ScalperPro (Medium Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'ScalperPro', 'Professional scalper with 6 years experience. Executes high-volume, low-risk trades on major forex pairs. Average hold time under 5 minutes.', 31.5, 79.8, 123, 4567, 'medium', 20.00, 30.00, 15, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'scalperpro@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #16 - ForexSignal (Low Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'ForexSignal', 'Technical analysis specialist. 10 years providing forex signals and market commentary. Focuses on price action and support/resistance levels on all major pairs.', 24.8, 81.3, 178, 1897, 'low', 18.00, 50.00, 16, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'forexsignal@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #17 - BullMarket (Medium Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'BullMarket', 'Trend follower specializing in bullish market conditions. 8 years trading indices and forex. Strong track record on NASDAQ, S&P 500, and USD/JPY during uptrends.', 33.2, 73.5, 145, 1098, 'medium', 22.00, 75.00, 17, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'bullmarket@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #18 - FXAnalyst (Low Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'FXAnalyst', 'Fundamental forex analyst. 12 years studying macroeconomics and central bank policies. Trades based on interest rate differentials and economic indicators.', 19.6, 84.2, 156, 1345, 'low', 15.00, 100.00, 18, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'fxanalyst@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #19 - TradeStorm (High Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'TradeStorm', 'Volatility trader thriving in turbulent markets. 7 years experience. Specializes in trading during high-impact news events on forex and commodities.', 45.3, 63.8, 76, 634, 'high', 30.00, 50.00, 19, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'tradestorm@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- #20 - CryptoFX (Medium Risk)
INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, display_order, is_verified, is_active, created_at, updated_at)
SELECT p.id, 'CryptoFX', 'Hybrid trader bridging forex and crypto markets. 5 years experience. Trades BTC/USD, ETH/USD alongside major forex pairs for diversified exposure.', 36.7, 70.8, 134, 923, 'medium', 25.00, 60.00, 20, TRUE, TRUE, NOW(), NOW()
FROM public.profiles p WHERE p.email = 'cryptofx@primestone.com'
AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id);

-- 5. Set Flossin as admin (so he can edit his results from his account)
UPDATE public.profiles SET role = 'admin'
WHERE email = 'flossin@primestone.com';

-- 6. Verify the data
SELECT mt.display_order, mt.display_name, mt.roi, mt.win_rate, mt.total_followers, mt.risk_level, mt.is_verified
FROM public.master_traders mt
WHERE mt.is_active = true
ORDER BY mt.display_order ASC;
