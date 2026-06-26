-- Add default TP/SL and missing columns to master_traders
ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS default_stop_loss DECIMAL(18,5);
ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS default_take_profit DECIMAL(18,5);
ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS total_pnl DECIMAL(18,2) DEFAULT 0.00;
