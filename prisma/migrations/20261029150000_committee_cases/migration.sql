-- CreateTable
CREATE TABLE "committee_members" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alternate" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_cases" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "matchId" TEXT,
    "title" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DEFENSA',
    "evidenceDeadline" TIMESTAMP(3) NOT NULL,
    "defenseDeadline" TIMESTAMP(3),
    "voteDeadline" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "notificationProof" TEXT,
    "proposal" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNumber" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_statements" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_ballots" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" TEXT,
    "reason" TEXT,
    "votedAt" TIMESTAMP(3),

    CONSTRAINT "committee_ballots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_events" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "committee_members_seasonId_userId_key" ON "committee_members"("seasonId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "committee_cases_resolutionNumber_key" ON "committee_cases"("resolutionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "committee_cases_parentId_key" ON "committee_cases"("parentId");

-- CreateIndex
CREATE INDEX "committee_cases_seasonId_status_idx" ON "committee_cases"("seasonId", "status");

-- CreateIndex
CREATE INDEX "committee_statements_caseId_idx" ON "committee_statements"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "committee_ballots_caseId_userId_key" ON "committee_ballots"("caseId", "userId");

-- CreateIndex
CREATE INDEX "committee_events_caseId_idx" ON "committee_events"("caseId");

-- AddForeignKey
ALTER TABLE "committee_statements" ADD CONSTRAINT "committee_statements_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "committee_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_ballots" ADD CONSTRAINT "committee_ballots_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "committee_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_events" ADD CONSTRAINT "committee_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "committee_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Committee evidence and ballots must never be exposed via the public Data API.
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON committee_members,committee_cases,committee_statements,committee_ballots,committee_events FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON committee_members,committee_cases,committee_statements,committee_ballots,committee_events FROM authenticated;
  END IF;
END $$;
ALTER TABLE committee_cases ADD CONSTRAINT committee_case_status_check CHECK (status IN ('DEFENSA','VOTACION','APROBADA','RECHAZADA'));
ALTER TABLE committee_ballots ADD CONSTRAINT committee_vote_choice_check CHECK (choice IS NULL OR choice IN ('APROBAR','RECHAZAR'));
ALTER TABLE committee_ballots ADD CONSTRAINT committee_vote_complete_check CHECK (
  (choice IS NULL AND reason IS NULL AND "votedAt" IS NULL) OR
  (choice IS NOT NULL AND reason IS NOT NULL AND length(trim(reason)) > 0 AND "votedAt" IS NOT NULL)
);
-- Immutable evidence and audit history. Ballots can be filled once, never edited after voting.
CREATE FUNCTION committee_prevent_edits() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Committee history is append-only'; END $$;
CREATE TRIGGER committee_statements_immutable BEFORE UPDATE OR DELETE ON committee_statements FOR EACH ROW EXECUTE FUNCTION committee_prevent_edits();
CREATE TRIGGER committee_events_immutable BEFORE UPDATE OR DELETE ON committee_events FOR EACH ROW EXECUTE FUNCTION committee_prevent_edits();
CREATE FUNCTION committee_protect_ballot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' OR OLD."votedAt" IS NOT NULL THEN RAISE EXCEPTION 'Ballot cannot be changed'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER committee_ballot_immutable BEFORE UPDATE OR DELETE ON committee_ballots FOR EACH ROW EXECUTE FUNCTION committee_protect_ballot();
REVOKE ALL ON FUNCTION committee_prevent_edits(),committee_protect_ballot() FROM PUBLIC;

CREATE FUNCTION committee_protect_case() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."resolvedAt" IS NOT NULL THEN RAISE EXCEPTION 'Resolved case is immutable'; END IF;
 IF OLD.status = 'VOTACION' AND (NEW.proposal IS DISTINCT FROM OLD.proposal OR NEW."applicantId" <> OLD."applicantId" OR NEW."respondentId" <> OLD."respondentId") THEN
  RAISE EXCEPTION 'Proposal and parties are frozen';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER committee_case_immutable BEFORE UPDATE ON committee_cases FOR EACH ROW EXECUTE FUNCTION committee_protect_case();
REVOKE ALL ON FUNCTION committee_protect_case() FROM PUBLIC;
