-- Auto-create a demo MT4 account when a new profile is created
-- This gives new users an immediate demo account to start trading with

CREATE OR REPLACE FUNCTION public.handle_new_demo_account()
RETURNS TRIGGER AS $$
DECLARE
  demo_login TEXT;
  demo_password TEXT;
BEGIN
  -- Generate random demo credentials
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

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_profile_created_demo ON public.profiles;
CREATE TRIGGER on_profile_created_demo
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_demo_account();
