-- Comprehensive migration: applies all pending changes safely

-- ============================================
-- 1. Phase 6: Account triggers + transaction policies
-- ============================================

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

INSERT INTO public.accounts (user_id, type, balance, equity, leverage)
SELECT id, 'standard', 0.00, 0.00, '1:100'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.accounts)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create deposits') THEN
    CREATE POLICY "Users create deposits" ON public.transactions
      FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'deposit');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create withdrawals') THEN
    CREATE POLICY "Users create withdrawals" ON public.transactions
      FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'withdrawal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own transactions') THEN
    CREATE POLICY "Users update own transactions" ON public.transactions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own account') THEN
    CREATE POLICY "Users update own account" ON public.accounts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 2. Demo account trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_demo_account()
RETURNS TRIGGER AS $$
DECLARE
  demo_login TEXT;
  demo_password TEXT;
BEGIN
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

DROP TRIGGER IF EXISTS on_profile_created_demo ON public.profiles;
CREATE TRIGGER on_profile_created_demo
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_demo_account();

-- ============================================
-- 3. Admin role column
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- ============================================
-- 4. Master traders missing columns
-- ============================================

ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_master_traders_display_order ON public.master_traders(display_order ASC);

ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS default_stop_loss DECIMAL(18,5);
ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS default_take_profit DECIMAL(18,5);

-- ============================================
-- 5. Copy trading schema fixes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_trades_master_trade_id ON public.trades(master_trade_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower_status ON public.copy_trade_subscriptions(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_master_status ON public.copy_trade_subscriptions(master_trader_id, status);

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
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. Backfill profiles for existing auth users
-- ============================================

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

-- ============================================
-- 7. Realtime publication
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'trades'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
  END IF;
END $$;
