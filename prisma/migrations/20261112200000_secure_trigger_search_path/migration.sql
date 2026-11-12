-- Security hardening: lock trigger function name resolution to trusted schemas.
-- Existing trigger bodies reference public tables without schema qualification.
-- public is searched before pg_temp; pg_catalog is searched implicitly first.
ALTER FUNCTION public.committee_guard_match() SET search_path = public, pg_temp;
ALTER FUNCTION public.committee_guard_sports_event() SET search_path = public, pg_temp;
ALTER FUNCTION public.committee_prevent_edits() SET search_path = public, pg_temp;
ALTER FUNCTION public.committee_protect_ballot() SET search_path = public, pg_temp;
ALTER FUNCTION public.committee_protect_case() SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_regulation_acceptance() SET search_path = public, pg_temp;
