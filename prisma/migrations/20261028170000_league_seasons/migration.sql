BEGIN;
-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('INSCRIPCION', 'EN_CURSO', 'FINALIZADA');
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');
-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'INSCRIPCION',
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "registrationDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "archive" JSONB,
    "standingsCriteria" TEXT NOT NULL DEFAULT 'PTS,DG,GF',

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);
-- AlterTable
ALTER TABLE "tournament_settings" ADD COLUMN     "currentSeasonId" TEXT;
INSERT INTO seasons (id,name,slug,status,"registrationOpen") VALUES ('liga-inicial','Liga actual','liga-actual','EN_CURSO',false);
UPDATE tournament_settings SET "currentSeasonId"='liga-inicial' WHERE id='settings';
UPDATE seasons SET "standingsCriteria"=(SELECT "standingsCriteria" FROM tournament_settings WHERE id='settings') WHERE id='liga-inicial';
CREATE FUNCTION current_league_season_id() RETURNS text LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$ SELECT "currentSeasonId" FROM tournament_settings WHERE id='settings' $$;
REVOKE ALL ON FUNCTION current_league_season_id() FROM PUBLIC, anon, authenticated;




-- DropIndex
DROP INDEX "teams_name_key";

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "seasonId" TEXT NOT NULL DEFAULT current_league_season_id();

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "seasonId" TEXT NOT NULL DEFAULT current_league_season_id();

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "seasonId" TEXT NOT NULL DEFAULT current_league_season_id();

-- AlterTable
ALTER TABLE "sanctions" ADD COLUMN     "seasonId" TEXT NOT NULL DEFAULT current_league_season_id();

-- AlterTable
ALTER TABLE "point_adjustments" ADD COLUMN     "seasonId" TEXT NOT NULL DEFAULT current_league_season_id();



-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "seasonId" TEXT NOT NULL DEFAULT current_league_season_id();

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "seasonId" TEXT NOT NULL DEFAULT current_league_season_id();



-- CreateTable
CREATE TABLE "league_registrations" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "gamertag" TEXT NOT NULL,
    "delegateFirstName" TEXT NOT NULL,
    "delegateLastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "userId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "teamId" TEXT,

    CONSTRAINT "league_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seasons_slug_key" ON "seasons"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "league_registrations_teamId_key" ON "league_registrations"("teamId");

-- CreateIndex
CREATE INDEX "league_registrations_seasonId_status_idx" ON "league_registrations"("seasonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "league_registrations_seasonId_email_key" ON "league_registrations"("seasonId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "league_registrations_seasonId_teamName_key" ON "league_registrations"("seasonId", "teamName");

-- CreateIndex
CREATE UNIQUE INDEX "league_registrations_seasonId_userId_key" ON "league_registrations"("seasonId", "userId");

-- CreateIndex
CREATE INDEX "teams_seasonId_idx" ON "teams"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_seasonId_name_key" ON "teams"("seasonId", "name");

-- CreateIndex
CREATE INDEX "players_seasonId_idx" ON "players"("seasonId");

-- CreateIndex
CREATE INDEX "matches_seasonId_idx" ON "matches"("seasonId");

-- CreateIndex
CREATE INDEX "sanctions_seasonId_idx" ON "sanctions"("seasonId");

-- CreateIndex
CREATE INDEX "point_adjustments_seasonId_idx" ON "point_adjustments"("seasonId");

-- CreateIndex
CREATE INDEX "videos_seasonId_idx" ON "videos"("seasonId");

-- CreateIndex
CREATE INDEX "news_seasonId_idx" ON "news"("seasonId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_adjustments" ADD CONSTRAINT "point_adjustments_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_settings" ADD CONSTRAINT "tournament_settings_currentSeasonId_fkey" FOREIGN KEY ("currentSeasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_registrations" ADD CONSTRAINT "league_registrations_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_registrations" ADD CONSTRAINT "league_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_registrations" ADD CONSTRAINT "league_registrations_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_registrations" ADD CONSTRAINT "league_registrations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep a single operational league. Historical rows remain in their original tables.
CREATE UNIQUE INDEX seasons_one_operational ON seasons ((true)) WHERE status <> 'FINALIZADA';
ALTER TABLE seasons ADD CONSTRAINT seasons_closed_archive CHECK (status <> 'FINALIZADA' OR (archive IS NOT NULL AND "endedAt" IS NOT NULL AND NOT "registrationOpen"));

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE seasons, league_registrations FROM anon, authenticated, PUBLIC;

CREATE FUNCTION guard_league_row() RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  doc jsonb;
  old_doc jsonb;
  sid text;
  old_sid text;
  current_sid text;
  ref text;
  key text;
BEGIN
  PERFORM pg_advisory_xact_lock_shared(736527184);
  IF TG_OP = 'DELETE' THEN doc := to_jsonb(OLD); ELSE doc := to_jsonb(NEW); END IF;
  sid := doc->>'seasonId';
  IF sid IS NULL THEN SELECT "seasonId" INTO sid FROM matches WHERE id = doc->>'matchId'; END IF;
  IF TG_OP = 'UPDATE' THEN
    old_doc := to_jsonb(OLD);
    old_sid := old_doc->>'seasonId';
    IF old_sid IS NULL THEN SELECT "seasonId" INTO old_sid FROM matches WHERE id = old_doc->>'matchId'; END IF;
    IF sid IS DISTINCT FROM old_sid THEN RAISE EXCEPTION 'No se pueden trasladar registros entre ligas'; END IF;
  END IF;
  SELECT "currentSeasonId" INTO current_sid FROM tournament_settings WHERE id='settings';
  IF sid IS NULL OR sid IS DISTINCT FROM current_sid OR NOT EXISTS(SELECT 1 FROM seasons WHERE id=sid AND status <> 'FINALIZADA') THEN
    RAISE EXCEPTION 'La liga está archivada y sus datos son de solo lectura';
  END IF;
  FOREACH key IN ARRAY ARRAY['teamId','homeTeamId','awayTeamId','forfeitedTeamId'] LOOP
    ref := doc->>key;
    IF ref IS NOT NULL AND NOT EXISTS(SELECT 1 FROM teams WHERE id=ref AND "seasonId"=sid) THEN
      RAISE EXCEPTION 'El equipo no pertenece a esta liga';
    END IF;
  END LOOP;
  ref := doc->>'playerId';
  IF ref IS NOT NULL AND NOT EXISTS(SELECT 1 FROM players WHERE id=ref AND "seasonId"=sid) THEN RAISE EXCEPTION 'El jugador no pertenece a esta liga'; END IF;
  ref := doc->>'matchId';
  IF ref IS NOT NULL AND NOT EXISTS(SELECT 1 FROM matches WHERE id=ref AND "seasonId"=sid) THEN RAISE EXCEPTION 'El partido no pertenece a esta liga'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION guard_league_row() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE tab text;
BEGIN
  FOREACH tab IN ARRAY ARRAY['teams','players','matches','sanctions','point_adjustments','videos','news','match_goals','match_cards','match_participations','predictions','league_registrations'] LOOP
    EXECUTE format('CREATE TRIGGER league_history_guard BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION guard_league_row()', tab);
  END LOOP;
END;
$$;

CREATE FUNCTION guard_closed_season() RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(736527184);
  IF OLD.status = 'FINALIZADA' THEN RAISE EXCEPTION 'El histórico de una liga finalizada no se puede modificar'; END IF;
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Las ligas se archivan, no se eliminan'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION guard_closed_season() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER immutable_closed_season BEFORE UPDATE OR DELETE ON seasons FOR EACH ROW EXECUTE FUNCTION guard_closed_season();

COMMIT;
