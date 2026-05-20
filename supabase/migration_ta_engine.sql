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
