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
