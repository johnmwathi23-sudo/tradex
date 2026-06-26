-- Add display_order column to master_traders for custom ranking
ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add index for sorting by display_order
CREATE INDEX IF NOT EXISTS idx_master_traders_display_order ON public.master_traders(display_order ASC);
