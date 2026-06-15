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
