-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MatchStatus" ADD VALUE 'RESULTADO_ADMINISTRATIVO';
ALTER TYPE "MatchStatus" ADD VALUE 'ANULADO_VENCIMIENTO';
ALTER TYPE "MatchStatus" ADD VALUE 'ANULADO_TECNICO';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "committeeCaseId" TEXT,
ADD COLUMN     "officialAwayScore" INTEGER,
ADD COLUMN     "officialHomeScore" INTEGER;

-- AlterTable
ALTER TABLE "committee_cases" ADD COLUMN     "proposedEffect" TEXT,
ADD COLUMN     "residualEffect" TEXT,
ADD COLUMN     "residualResolution" TEXT;

-- CreateTable
CREATE TABLE "committee_applications" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "committee_applications_caseId_key" ON "committee_applications"("caseId");

-- CreateIndex
CREATE INDEX "committee_applications_seasonId_idx" ON "committee_applications"("seasonId");


-- Private immutable application ledger; never exposed to the Data API.
ALTER TABLE committee_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON committee_applications FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON committee_applications FROM anon; END IF;
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON committee_applications FROM authenticated; END IF;
END $$;
CREATE TRIGGER committee_applications_immutable BEFORE UPDATE OR DELETE ON committee_applications FOR EACH ROW EXECUTE FUNCTION committee_prevent_edits();
ALTER TABLE committee_applications ADD CONSTRAINT committee_application_case_fk FOREIGN KEY ("caseId") REFERENCES committee_cases(id) ON DELETE RESTRICT;
ALTER TABLE committee_applications ADD CONSTRAINT committee_application_match_fk FOREIGN KEY ("matchId") REFERENCES matches(id) ON DELETE RESTRICT;
ALTER TABLE matches ADD CONSTRAINT committee_match_case_fk FOREIGN KEY ("committeeCaseId") REFERENCES committee_cases(id) ON DELETE RESTRICT;
ALTER TABLE matches ADD CONSTRAINT official_score_pair CHECK (
 ("officialHomeScore" IS NULL AND "officialAwayScore" IS NULL) OR
 ("officialHomeScore" IS NOT NULL AND "officialAwayScore" IS NOT NULL AND "officialHomeScore">=0 AND "officialAwayScore">=0)
);
-- Freeze structured effects with the complete proposal, also for existing cases.
CREATE OR REPLACE FUNCTION committee_protect_case() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."resolvedAt" IS NOT NULL THEN RAISE EXCEPTION 'Resolved case is immutable'; END IF;
 IF OLD.status = 'VOTACION' AND (
   NEW.proposal IS DISTINCT FROM OLD.proposal OR NEW."proposedEffect" IS DISTINCT FROM OLD."proposedEffect" OR
   NEW."residualEffect" IS DISTINCT FROM OLD."residualEffect" OR NEW."residualResolution" IS DISTINCT FROM OLD."residualResolution" OR NEW."matchId" IS DISTINCT FROM OLD."matchId" OR
   NEW."seasonId" IS DISTINCT FROM OLD."seasonId" OR NEW."parentId" IS DISTINCT FROM OLD."parentId" OR
   NEW."applicantId" <> OLD."applicantId" OR NEW."respondentId" <> OLD."respondentId"
 ) THEN RAISE EXCEPTION 'Proposal and parties are frozen'; END IF;
 RETURN NEW;
END $$;
-- Ordinary result editors cannot change or erase a ruling. A reviewing ruling
-- uses a transaction-local flag after checking quorum, finality and permission.
CREATE FUNCTION committee_guard_match() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF current_setting('aefpy.committee_application',true) = 'on' THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF;
   RETURN NEW;
 END IF;
 IF TG_OP='INSERT' THEN
   IF NEW."committeeCaseId" IS NOT NULL OR NEW."officialHomeScore" IS NOT NULL OR NEW."officialAwayScore" IS NOT NULL THEN RAISE EXCEPTION 'Use committee application'; END IF;
   RETURN NEW;
 END IF;
 IF OLD."committeeCaseId" IS NOT NULL THEN RAISE EXCEPTION 'Committee result is protected; use independent review'; END IF;
 IF TG_OP='DELETE' THEN
   IF EXISTS(SELECT FROM committee_cases WHERE "matchId"=OLD.id) THEN RAISE EXCEPTION 'Match has committee history'; END IF;
   RETURN OLD;
 END IF;
 IF NEW."committeeCaseId" IS DISTINCT FROM OLD."committeeCaseId" OR NEW."officialHomeScore" IS DISTINCT FROM OLD."officialHomeScore" OR NEW."officialAwayScore" IS DISTINCT FROM OLD."officialAwayScore" THEN RAISE EXCEPTION 'Use committee application'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER committee_match_guard BEFORE INSERT OR UPDATE OR DELETE ON matches FOR EACH ROW EXECUTE FUNCTION committee_guard_match();
CREATE FUNCTION committee_guard_sports_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE mid text;
BEGIN
 IF TG_OP='INSERT' THEN mid=NEW."matchId"; ELSE mid=OLD."matchId"; END IF;
 IF EXISTS(SELECT FROM matches WHERE id=mid AND "committeeCaseId" IS NOT NULL) THEN RAISE EXCEPTION 'Committee result is protected'; END IF;
 IF TG_OP='UPDATE' AND EXISTS(SELECT FROM matches WHERE id=NEW."matchId" AND "committeeCaseId" IS NOT NULL) THEN RAISE EXCEPTION 'Committee result is protected'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER committee_goal_guard BEFORE INSERT OR UPDATE OR DELETE ON match_goals FOR EACH ROW EXECUTE FUNCTION committee_guard_sports_event();
CREATE TRIGGER committee_card_guard BEFORE INSERT OR UPDATE OR DELETE ON match_cards FOR EACH ROW EXECUTE FUNCTION committee_guard_sports_event();
CREATE TRIGGER committee_participation_guard BEFORE INSERT OR UPDATE OR DELETE ON match_participations FOR EACH ROW EXECUTE FUNCTION committee_guard_sports_event();
REVOKE ALL ON FUNCTION committee_guard_match(),committee_guard_sports_event() FROM PUBLIC;
