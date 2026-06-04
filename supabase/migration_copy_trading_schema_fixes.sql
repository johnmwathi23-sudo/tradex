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
