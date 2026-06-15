-- Crypto Payment Automation Schema
-- Adds tables for Stripe -> USDT conversion pipeline

-- Payments (tracks Stripe payment lifecycle)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_event_id TEXT,
  amount_usd DECIMAL(18,2) NOT NULL,
  usdt_amount DECIMAL(18,6),
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN (
      'initiated',
      'stripe_confirmed',
      'queued_for_conversion',
      'converting',
      'crypto_received',
      'transfer_initiated',
      'completed',
      'failed'
    )),
  idempotency_key TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversion jobs (OKX market orders to buy USDT)
CREATE TABLE public.conversion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) NOT NULL,
  usdt_amount DECIMAL(18,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'converting', 'completed', 'failed')),
  okx_order_id TEXT,
  okx_fill_price DECIMAL(18,6),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_log JSONB DEFAULT '[]',
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crypto transfers (USDT sent to external wallet)
CREATE TABLE public.crypto_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_job_id UUID REFERENCES public.conversion_jobs(id) NOT NULL,
  wallet_address TEXT NOT NULL,
  blockchain_network TEXT NOT NULL DEFAULT 'TRC20',
  amount_usdt DECIMAL(18,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'confirmed', 'failed')),
  tx_hash TEXT,
  wallet_type TEXT NOT NULL DEFAULT 'okx',
  retry_count INT DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs (immutable audit trail for all state transitions)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id),
  conversion_job_id UUID REFERENCES public.conversion_jobs(id),
  event_type TEXT NOT NULL,
  status_from TEXT,
  status_to TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_stripe_pi ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_conversion_jobs_status ON public.conversion_jobs(status);
CREATE INDEX idx_crypto_transfers_status ON public.crypto_transfers(status);
CREATE INDEX idx_audit_logs_payment_id ON public.audit_logs(payment_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read own payments
CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read own conversion jobs (via payment_id)
CREATE POLICY "Users read own conversion jobs" ON public.conversion_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.payments WHERE id = conversion_jobs.payment_id AND user_id = auth.uid())
  );

-- Users can read own crypto transfers (via conversion_job_id -> payment_id)
CREATE POLICY "Users read own crypto transfers" ON public.crypto_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversion_jobs cj
      JOIN public.payments p ON p.id = cj.payment_id
      WHERE cj.id = crypto_transfers.conversion_job_id AND p.user_id = auth.uid()
    )
  );

-- Users can read own audit logs (via payment_id)
CREATE POLICY "Users read own audit logs" ON public.audit_logs
  FOR SELECT USING (
    payment_id IS NULL OR EXISTS (
      SELECT 1 FROM public.payments WHERE id = audit_logs.payment_id AND user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversion_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_transfers;
