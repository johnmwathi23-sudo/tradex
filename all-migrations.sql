-- Tradex - Combined Database Migrations
-- Generated: 2026-06-24T05:53:50.450Z

-- ================================================================
-- File: schema.sql
-- ================================================================

-- Primestone Markets Database Schema for Supabase

-- Users table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  country TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading accounts
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('standard', 'ecn', 'pro')),
  currency TEXT DEFAULT 'USD',
  balance DECIMAL(18,2) DEFAULT 0.00,
  equity DECIMAL(18,2) DEFAULT 0.00,
  margin DECIMAL(18,2) DEFAULT 0.00,
  leverage TEXT DEFAULT '1:100',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  mt4_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (deposits & withdrawals)
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  method TEXT NOT NULL CHECK (method IN ('stripe', 'card', 'bank_transfer', 'crypto_usdt', 'crypto_btc')),
  amount DECIMAL(18,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC documents
CREATE TABLE public.kyc_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'national_id', 'drivers_license', 'proof_of_address')),
  document_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master traders (for copy trading)
CREATE TABLE public.master_traders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  roi DECIMAL(10,2) DEFAULT 0.00,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  total_followers INTEGER DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  performance_fee DECIMAL(5,2) DEFAULT 20.00,
  min_investment DECIMAL(18,2) DEFAULT 10.00,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy trading subscriptions
CREATE TABLE public.copy_trade_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) NOT NULL,
  master_trader_id UUID REFERENCES public.master_traders(id) NOT NULL,
  allocation_percentage DECIMAL(5,2) NOT NULL,
  allocated_amount DECIMAL(18,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  max_drawdown DECIMAL(5,2) DEFAULT 20.00,
  auto_topup BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, master_trader_id)
);

-- Trades
CREATE TABLE public.trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  master_trade_id UUID, -- if copied from a master trader
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  volume DECIMAL(10,2) NOT NULL,
  open_price DECIMAL(18,5) NOT NULL,
  close_price DECIMAL(18,5),
  stop_loss DECIMAL(18,5),
  take_profit DECIMAL(18,5),
  profit DECIMAL(18,5),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  signal_id UUID,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_traders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_trade_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users read own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own kyc" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own subscriptions" ON public.copy_trade_subscriptions FOR SELECT USING (auth.uid() = follower_id);
CREATE POLICY "Users insert own subscriptions" ON public.copy_trade_subscriptions FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users update own subscriptions" ON public.copy_trade_subscriptions FOR UPDATE USING (auth.uid() = follower_id);
CREATE POLICY "Users delete own subscriptions" ON public.copy_trade_subscriptions FOR DELETE USING (auth.uid() = follower_id);

-- Followers can read trades from masters they subscribe to
CREATE POLICY "Follower read subscribed master trades" ON public.trades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM copy_trade_subscriptions
    JOIN master_traders ON master_traders.id = copy_trade_subscriptions.master_trader_id
    WHERE copy_trade_subscriptions.follower_id = auth.uid()
    AND master_traders.user_id = trades.user_id
    AND copy_trade_subscriptions.status IN ('active', 'paused')
  )
);

-- Master traders are publicly readable
CREATE POLICY "Public read master traders" ON public.master_traders FOR SELECT USING (TRUE);

-- Enable realtime for trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;


-- ================================================================
-- File: crypto_schema.sql
-- ================================================================

-- Crypto Payment Automation Schema
-- Adds tables for Stripe -> USDT conversion pipeline

-- Payments (tracks Stripe payment lifecycle)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_event_id TEXT,
  amount_usd DECIMAL(18,2) NOT NULL,
  usdt_amount DECIMAL(18,6),
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN (
      'initiated',
      'stripe_confirmed',
      'queued_for_conversion',
      'converting',
      'crypto_received',
      'transfer_initiated',
      'completed',
      'failed'
    )),
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversion jobs (Circle USDC transfers)
CREATE TABLE public.conversion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) NOT NULL,
  usdt_amount DECIMAL(18,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'converting', 'completed', 'failed')),
  circle_transfer_id TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_log JSONB DEFAULT '[]',
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crypto transfers (USDC sent to external wallet)
CREATE TABLE public.crypto_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_job_id UUID REFERENCES public.conversion_jobs(id) NOT NULL,
  wallet_address TEXT NOT NULL,
  blockchain_network TEXT NOT NULL DEFAULT 'TRC20',
  amount_usdt DECIMAL(18,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'confirmed', 'failed')),
  tx_hash TEXT,
  wallet_type TEXT NOT NULL DEFAULT 'circle',
  retry_count INT DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs (immutable audit trail for all state transitions)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id),
  conversion_job_id UUID REFERENCES public.conversion_jobs(id),
  event_type TEXT NOT NULL,
  status_from TEXT,
  status_to TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_stripe_pi ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_conversion_jobs_status ON public.conversion_jobs(status);
CREATE INDEX idx_crypto_transfers_status ON public.crypto_transfers(status);
CREATE INDEX idx_audit_logs_payment_id ON public.audit_logs(payment_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read own payments
CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read own conversion jobs (via payment_id)
CREATE POLICY "Users read own conversion jobs" ON public.conversion_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.payments WHERE id = conversion_jobs.payment_id AND user_id = auth.uid())
  );

-- Users can read own crypto transfers (via conversion_job_id -> payment_id)
CREATE POLICY "Users read own crypto transfers" ON public.crypto_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversion_jobs cj
      JOIN public.payments p ON p.id = cj.payment_id
      WHERE cj.id = crypto_transfers.conversion_job_id AND p.user_id = auth.uid()
    )
  );

-- Users can read own audit logs (via payment_id)
CREATE POLICY "Users read own audit logs" ON public.audit_logs
  FOR SELECT USING (
    payment_id IS NULL OR EXISTS (
      SELECT 1 FROM public.payments WHERE id = audit_logs.payment_id AND user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversion_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_transfers;


-- ================================================================
-- File: migration_admin.sql
-- ================================================================

-- Phase 8: Admin Panel

-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));


-- ================================================================
-- File: migration_ai_trading.sql
-- ================================================================

-- AI Trading Signals Table
CREATE TABLE IF NOT EXISTS public.ai_trading_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  entry_price_min DECIMAL(18,5),
  entry_price_max DECIMAL(18,5),
  stop_loss DECIMAL(18,5),
  take_profit DECIMAL(18,5),
  rationale TEXT,
  reasoning TEXT,
  news_headlines TEXT[],
  timeframe TEXT DEFAULT '1h',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'expired', 'cancelled')),
  executed_at TIMESTAMPTZ,
  trade_id UUID REFERENCES public.trades(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_trading_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read ai trading signals" ON public.ai_trading_signals
  FOR SELECT USING (true);

CREATE POLICY "Service role manage ai trading signals" ON public.ai_trading_signals
  FOR ALL USING (true) WITH CHECK (true);

-- Add AI-generated flag and signal_id to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS signal_id UUID REFERENCES public.ai_trading_signals(id);

-- Fix trades FK to use mt_accounts instead of accounts
-- (already done in migration_fix_trades_fk.sql, ensure compatibility)


-- ================================================================
-- File: migration_circle.sql
-- ================================================================

-- Migration: Replace OKX with Circle
-- Run this after deploying the code changes

ALTER TABLE public.conversion_jobs
  ADD COLUMN circle_transfer_id TEXT;

UPDATE public.conversion_jobs
  SET circle_transfer_id = okx_order_id
  WHERE okx_order_id IS NOT NULL;

ALTER TABLE public.conversion_jobs
  DROP COLUMN okx_order_id,
  DROP COLUMN okx_fill_price;

ALTER TABLE public.crypto_transfers
  ALTER COLUMN wallet_type SET DEFAULT 'circle';

UPDATE public.crypto_transfers
  SET wallet_type = 'circle'
  WHERE wallet_type = 'okx';


-- ================================================================
-- File: migration_copy_trading_schema_fixes.sql
-- ================================================================

-- Copy Trading Schema Fixes
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/sihrklvlobgvoxocoaoi/sql/new)

-- 1. Add is_ai_generated and signal_id to trades (if not already present)
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS signal_id UUID;

-- 2. Add updated_at to copy_trade_subscriptions
ALTER TABLE public.copy_trade_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add unique constraint on (follower_id, master_trader_id)
-- Remove any existing duplicates first (keep the active one, remove stopped ones)
DELETE FROM public.copy_trade_subscriptions a
USING public.copy_trade_subscriptions b
WHERE a.id < b.id
  AND a.follower_id = b.follower_id
  AND a.master_trader_id = b.master_trader_id
  AND a.status = 'stopped';

-- Now add the constraint (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'copy_trade_subscriptions_follower_id_master_trader_id_key'
  ) THEN
    ALTER TABLE public.copy_trade_subscriptions
    ADD CONSTRAINT copy_trade_subscriptions_follower_id_master_trader_id_key
    UNIQUE (follower_id, master_trader_id);
  END IF;
END $$;

-- 4. Add RLS policy for followers to read master trades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Follower read subscribed master trades'
  ) THEN
    CREATE POLICY "Follower read subscribed master trades" ON public.trades FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM copy_trade_subscriptions
        JOIN master_traders ON master_traders.id = copy_trade_subscriptions.master_trader_id
        WHERE copy_trade_subscriptions.follower_id = auth.uid()
        AND master_traders.user_id = trades.user_id
        AND copy_trade_subscriptions.status IN ('active', 'paused')
      )
    );
  END IF;
END $$;

-- 5. Add trigger to auto-update updated_at on copy_trade_subscriptions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_copy_trade_subscriptions_updated_at ON public.copy_trade_subscriptions;
CREATE TRIGGER set_copy_trade_subscriptions_updated_at
  BEFORE UPDATE ON public.copy_trade_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Add index on trades.master_trade_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_trades_master_trade_id ON public.trades(master_trade_id);

-- 7. Add index on copy_trade_subscriptions for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower_status ON public.copy_trade_subscriptions(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_master_status ON public.copy_trade_subscriptions(master_trader_id, status);

-- 8. Verify the master traders exist
SELECT id, display_name, roi, win_rate, risk_level, is_verified
FROM public.master_traders
WHERE is_active = true
ORDER BY created_at;


-- ================================================================
-- File: migration_fix_trades_fk.sql
-- ================================================================

-- Fix trades.account_id to reference mt_accounts instead of accounts
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_account_id_fkey;
ALTER TABLE public.trades ADD CONSTRAINT trades_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.mt_accounts(id);


-- ================================================================
-- File: migration_phase6.sql
-- ================================================================

-- Phase 6: Deposit/Withdrawal System

-- Auto-create trading account on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, type, balance, equity, leverage)
  VALUES (NEW.id, 'standard', 0.00, 0.00, '1:100');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_account();

-- Create pending deposits for existing users who lack an account
INSERT INTO public.accounts (user_id, type, balance, equity, leverage)
SELECT id, 'standard', 0.00, 0.00, '1:100'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.accounts);

-- Allow inserts into transactions for deposit processing
CREATE POLICY "Users create deposits" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'deposit');

CREATE POLICY "Users create withdrawals" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'withdrawal');

-- Allow inserts into mpesa_transactions
CREATE POLICY "Users create mpesa" ON public.mpesa_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow updating own mpesa transactions
CREATE POLICY "Users update own mpesa" ON public.mpesa_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow updating own transactions (for status changes)
CREATE POLICY "Users update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow updating own accounts (balance changes)
CREATE POLICY "Users update own account" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);




-- ================================================================
-- File: migration_phase7.sql
-- ================================================================

-- Phase 7: MT4/MT5 Broker Integration

-- MT4/MT5 accounts linked to user profiles
CREATE TABLE IF NOT EXISTS public.mt_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  login_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('mt4', 'mt5')),
  account_type TEXT NOT NULL CHECK (account_type IN ('demo', 'real')),
  server TEXT NOT NULL,
  broker TEXT,
  investor_password TEXT,  -- read-only investor password for trade copying
  account_currency TEXT DEFAULT 'USD',
  balance DECIMAL(18,2) DEFAULT 0.00,
  equity DECIMAL(18,2) DEFAULT 0.00,
  leverage TEXT DEFAULT '1:100',
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_synced_at TIMESTAMPTZ,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, login_id, platform)
);

ALTER TABLE public.mt_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own mt accounts" ON public.mt_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create mt accounts" ON public.mt_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mt accounts" ON public.mt_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own mt accounts" ON public.mt_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Instruments/symbols available for trading
CREATE TABLE IF NOT EXISTS public.instruments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT,
  category TEXT NOT NULL CHECK (category IN ('forex', 'commodities', 'indices', 'crypto', 'stocks')),
  digits INTEGER DEFAULT 5,
  pip_value DECIMAL(10,2) DEFAULT 0.0001,
  min_volume DECIMAL(10,2) DEFAULT 0.01,
  max_volume DECIMAL(10,2) DEFAULT 100.00,
  step_volume DECIMAL(10,2) DEFAULT 0.01,
  spread DECIMAL(10,5) DEFAULT 0.00001,
  swap_long DECIMAL(10,2) DEFAULT 0.00,
  swap_short DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read instruments" ON public.instruments FOR SELECT USING (TRUE);

-- Seed instruments
INSERT INTO public.instruments (symbol, name, category, spread) VALUES
  ('EURUSD', 'Euro / US Dollar', 'forex', 0.00001),
  ('GBPUSD', 'British Pound / US Dollar', 'forex', 0.00002),
  ('USDJPY', 'US Dollar / Japanese Yen', 'forex', 0.001),
  ('USDCHF', 'US Dollar / Swiss Franc', 'forex', 0.00002),
  ('AUDUSD', 'Australian Dollar / US Dollar', 'forex', 0.00002),
  ('USDCAD', 'US Dollar / Canadian Dollar', 'forex', 0.00002),
  ('NZDUSD', 'New Zealand Dollar / US Dollar', 'forex', 0.00002),
  ('EURGBP', 'Euro / British Pound', 'forex', 0.00002),
  ('EURJPY', 'Euro / Japanese Yen', 'forex', 0.001),
  ('GBPJPY', 'British Pound / Japanese Yen', 'forex', 0.002),
  ('XAUUSD', 'Gold / US Dollar', 'commodities', 0.01),
  ('XAGUSD', 'Silver / US Dollar', 'commodities', 0.001),
  ('USOIL', 'US Oil / US Dollar', 'commodities', 0.01),
  ('BTCUSD', 'Bitcoin / US Dollar', 'crypto', 1.00),
  ('ETHUSD', 'Ethereum / US Dollar', 'crypto', 0.50),
  ('SP500', 'S&P 500 Index', 'indices', 0.10),
  ('NAS100', 'NASDAQ 100 Index', 'indices', 0.10),
  ('UK100', 'FTSE 100 Index', 'indices', 0.10)
ON CONFLICT (symbol) DO NOTHING;


-- ================================================================
-- File: migration_ta_engine.sql
-- ================================================================

-- Price history for technical analysis
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  bid DECIMAL(18,5) NOT NULL,
  ask DECIMAL(18,5) NOT NULL,
  mid DECIMAL(18,5) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_symbol_ts
  ON public.price_history(symbol, recorded_at DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read price_history" ON public.price_history
  FOR SELECT USING (true);

CREATE POLICY "Service role insert price_history" ON public.price_history
  FOR INSERT WITH CHECK (true);

-- Seed synthetic price history for TA calculations
-- Generates ~300 data points per symbol with random walk from baselines
DO $$
DECLARE
  s TEXT;
  base_price DECIMAL(18,5);
  price DECIMAL(18,5);
  ts TIMESTAMPTZ;
  j INT;
BEGIN
  FOR s IN SELECT unnest(ARRAY['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','XAUUSD','BTCUSD','ETHUSD','USOIL','SP500']) LOOP
    base_price := CASE s
      WHEN 'EURUSD' THEN 1.0830 WHEN 'GBPUSD' THEN 1.2650 WHEN 'USDJPY' THEN 153.50
      WHEN 'AUDUSD' THEN 0.6550 WHEN 'USDCAD' THEN 1.3650 WHEN 'XAUUSD' THEN 2380.00
      WHEN 'BTCUSD' THEN 68500 WHEN 'ETHUSD' THEN 3450 WHEN 'USOIL' THEN 78.50
      WHEN 'SP500' THEN 5350 ELSE 100.0
    END;
    price := base_price;
    FOR j IN 0..299 LOOP
      ts := NOW() - ((300 - j) * INTERVAL '5 minutes');
      price := price * (1 + (random() - 0.5) * 0.004);
      INSERT INTO public.price_history (symbol, bid, ask, mid, recorded_at)
      VALUES (s, price * 0.9999, price * 1.0001, price, ts);
    END LOOP;
  END LOOP;
END $$;


-- ================================================================
-- File: migration_add_duration.sql
-- ================================================================

﻿ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 5;


-- ================================================================
-- File: migration_profiles_insert_policy.sql
-- ================================================================

-- Fix: Add INSERT policy for profiles table
-- Without this, newly registered users cannot create their profile row

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Backfill profiles for auth users who registered before the INSERT policy existed
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


-- ================================================================
-- File: migration_demo_account_trigger.sql
-- ================================================================

-- Auto-create a demo MT4 account when a new profile is created
-- This gives new users an immediate demo account to start trading with

CREATE OR REPLACE FUNCTION public.handle_new_demo_account()
RETURNS TRIGGER AS $$
DECLARE
  demo_login TEXT;
  demo_password TEXT;
BEGIN
  -- Generate random demo credentials
  demo_login := (1000000 + floor(random() * 9000000))::TEXT;
  demo_password := 'Demo' || substr(md5(random()::text), 1, 8);

  INSERT INTO public.mt_accounts (
    user_id, login_id, platform, server, broker,
    account_type, investor_password, account_currency,
    balance, equity, leverage, status, is_default
  ) VALUES (
    NEW.id, demo_login, 'mt4', 'Primestone-Demo',
    'Primestone Global Markets', 'demo', demo_password, 'USD',
    500.00, 500.00, '1:100', 'connected', true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_profile_created_demo ON public.profiles;
CREATE TRIGGER on_profile_created_demo
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_demo_account();

