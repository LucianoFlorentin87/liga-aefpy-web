-- Shared, atomic anti-abuse counters for staff login and password recovery.
-- Kept outside Prisma models: never expose to client or Data API.
CREATE TABLE IF NOT EXISTS public.auth_attempt_limits (
  key_hash text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_expires_at timestamptz NOT NULL
);
ALTER TABLE public.auth_attempt_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_attempt_limits FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS auth_attempt_limits_expiry_idx
  ON public.auth_attempt_limits (window_expires_at);
