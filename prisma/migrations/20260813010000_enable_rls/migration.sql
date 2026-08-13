-- La app nunca consulta Postgres via la API REST pública de Supabase (PostgREST) —
-- siempre se conecta directo con Prisma usando el rol dueño de las tablas (bypassea
-- RLS automáticamente). Pero Supabase expone TODAS las tablas del schema "public"
-- por esa API a cualquiera que tenga la anon key, salvo que RLS esté habilitado.
-- Sin políticas, RLS habilitado = acceso denegado por default para esa API — que es
-- exactamente lo que queremos, ya que nadie debería llegar a estas tablas por ahí.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_participations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sanctions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "point_adjustments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tournament_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fan_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "predictions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
