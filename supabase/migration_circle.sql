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
