-- AlterTable
ALTER TABLE "committee_members" ADD COLUMN     "linkedUserId" TEXT;

-- AlterTable
ALTER TABLE "committee_cases" ADD COLUMN     "article" INTEGER,
ADD COLUMN     "nature" TEXT,
ADD COLUMN     "regulationPublicationId" TEXT;

-- CreateTable
CREATE TABLE "regulation_publications" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfSha256" TEXT NOT NULL,
    "acceptanceText" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" TEXT NOT NULL,

    CONSTRAINT "regulation_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_acceptances" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "delegateName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regulation_publications_seasonId_version_key" ON "regulation_publications"("seasonId", "version");

-- CreateIndex
CREATE INDEX "regulation_acceptances_seasonId_idx" ON "regulation_acceptances"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_acceptances_publicationId_userId_key" ON "regulation_acceptances"("publicationId", "userId");


ALTER TABLE regulation_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_acceptances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON regulation_publications,regulation_acceptances FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON regulation_publications,regulation_acceptances FROM anon; END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON regulation_publications,regulation_acceptances FROM authenticated; END IF;
END $$;
ALTER TABLE regulation_publications ADD CONSTRAINT regulation_season_fk FOREIGN KEY ("seasonId") REFERENCES seasons(id) ON DELETE RESTRICT;
ALTER TABLE regulation_acceptances ADD CONSTRAINT acceptance_publication_fk FOREIGN KEY ("publicationId") REFERENCES regulation_publications(id) ON DELETE RESTRICT;
ALTER TABLE regulation_acceptances ADD CONSTRAINT acceptance_user_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE committee_cases ADD CONSTRAINT claim_regulation_fk FOREIGN KEY ("regulationPublicationId") REFERENCES regulation_publications(id) ON DELETE RESTRICT;
ALTER TABLE committee_cases ADD CONSTRAINT claim_article_range CHECK (article IS NULL OR article BETWEEN 1 AND 15);
CREATE TRIGGER regulation_publications_immutable BEFORE UPDATE OR DELETE ON regulation_publications FOR EACH ROW EXECUTE FUNCTION committee_prevent_edits();
CREATE TRIGGER regulation_acceptances_immutable BEFORE UPDATE OR DELETE ON regulation_acceptances FOR EACH ROW EXECUTE FUNCTION committee_prevent_edits();
ALTER TABLE regulation_publications ADD CONSTRAINT regulation_hash_check CHECK ("pdfSha256" ~ '^[a-f0-9]{64}$');
CREATE FUNCTION validate_regulation_acceptance() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (
  SELECT FROM regulation_publications p JOIN users u ON u.id=NEW."userId"
  JOIN roles r ON r.id=u."roleId" JOIN teams t ON t.id=u."teamId"
  WHERE p.id=NEW."publicationId" AND p."seasonId"=NEW."seasonId" AND t."seasonId"=p."seasonId"
   AND t.id=NEW."teamId" AND u.status='ACTIVO' AND r.key='DELEGADO'
   AND p."effectiveAt"<=now()
 ) THEN RAISE EXCEPTION 'Acceptance requires the delegate and team of the published edition'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER regulation_acceptance_validate BEFORE INSERT ON regulation_acceptances FOR EACH ROW EXECUTE FUNCTION validate_regulation_acceptance();
REVOKE ALL ON FUNCTION validate_regulation_acceptance() FROM PUBLIC;
