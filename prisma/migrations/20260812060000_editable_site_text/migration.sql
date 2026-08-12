-- Textos del sitio (hero, logo/wordmark, pie de página) pasan a ser
-- editables desde /admin/configuracion en vez de estar hardcodeados.
ALTER TABLE "tournament_settings" ADD COLUMN "orgName" TEXT NOT NULL DEFAULT 'Liga AEFPY';
ALTER TABLE "tournament_settings" ADD COLUMN "orgTagline" TEXT NOT NULL DEFAULT 'Asociación de Efootball Paraguay';
ALTER TABLE "tournament_settings" ADD COLUMN "heroSubtitle" TEXT NOT NULL DEFAULT 'Torneo de Fútbol';
ALTER TABLE "tournament_settings" ADD COLUMN "footerDescription" TEXT NOT NULL DEFAULT 'Torneo oficial organizado por la Liga AEFPY (Asociación de Efootball Paraguay).';

-- Preserva cualquier valor de "tournamentName" ya cargado a mano (el mismo
-- criterio que usaba la UI anterior para decidir si era un valor "custom").
UPDATE "tournament_settings"
SET "heroSubtitle" = "tournamentName"
WHERE "tournamentName" IS NOT NULL AND "tournamentName" NOT IN ('Torneo Exa Frutos', 'Liga AEFPY');

ALTER TABLE "tournament_settings" DROP COLUMN "tournamentName";
