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
