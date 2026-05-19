-- Phase 6: Deposit/Withdrawal System

-- Auto-create trading account on profile creation
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

-- Create pending deposits for existing users who lack an account
INSERT INTO public.accounts (user_id, type, balance, equity, leverage)
SELECT id, 'standard', 0.00, 0.00, '1:100'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.accounts);

-- Allow inserts into transactions for deposit processing
CREATE POLICY "Users create deposits" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'deposit');

CREATE POLICY "Users create withdrawals" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'withdrawal');

-- Allow inserts into mpesa_transactions
CREATE POLICY "Users create mpesa" ON public.mpesa_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow updating own mpesa transactions
CREATE POLICY "Users update own mpesa" ON public.mpesa_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow updating own transactions (for status changes)
CREATE POLICY "Users update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow updating own accounts (balance changes)
CREATE POLICY "Users update own account" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);


