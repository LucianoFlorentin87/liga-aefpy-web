-- Notifications are accessed through authenticated server-side Prisma actions only.
-- Do not expose private delegate messages through the Supabase Data API.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
