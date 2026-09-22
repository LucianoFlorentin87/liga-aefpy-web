-- Un equipo que abandona la liga a mitad de temporada pasa a RETIRADO (en
-- vez de INACTIVO, que hoy hace que sus partidos ya jugados desaparezcan de
-- la tabla de posiciones también para el rival). Sigue apareciendo en la
-- tabla con los puntos que ya sumó.
ALTER TYPE "TeamStatus" ADD VALUE 'RETIRADO';

-- Si un partido se resolvió por abandono (el equipo se retiró antes de
-- jugarlo), se fija en 3-0 en contra suyo en vez de cargar goles falsos.
ALTER TABLE "matches" ADD COLUMN "forfeitedTeamId" TEXT;
ALTER TABLE "matches" ADD CONSTRAINT "matches_forfeitedTeamId_fkey" FOREIGN KEY ("forfeitedTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "matches_forfeitedTeamId_idx" ON "matches"("forfeitedTeamId");
