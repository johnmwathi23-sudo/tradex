-- Fix trades.account_id to reference mt_accounts instead of accounts
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_account_id_fkey;
ALTER TABLE public.trades ADD CONSTRAINT trades_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.mt_accounts(id);
