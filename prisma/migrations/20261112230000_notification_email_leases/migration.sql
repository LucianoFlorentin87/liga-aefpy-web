ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "emailClaimedAt" timestamptz;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "emailAttempts" integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS notifications_email_delivery_idx ON public.notifications ("emailSentAt", "emailClaimedAt") WHERE "emailSentAt" IS NULL;
