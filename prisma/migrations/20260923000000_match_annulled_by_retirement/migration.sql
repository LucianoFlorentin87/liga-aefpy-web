-- Si un equipo se retira de la liga después de haber jugado un partido, ese
-- partido ya no cuenta para la tabla de nadie (ni PJ, ni goles, ni PG/PE/PP)
-- sin importar cómo salió en la cancha — el resultado real se sigue
-- mostrando a título informativo. El rival recibe en cambio una
-- bonificación fija de puntos (point_adjustments), separada del partido.
ALTER TABLE "matches" ADD COLUMN "annulledTeamId" TEXT;
ALTER TABLE "matches" ADD CONSTRAINT "matches_annulledTeamId_fkey" FOREIGN KEY ("annulledTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "matches_annulledTeamId_idx" ON "matches"("annulledTeamId");
