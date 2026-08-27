-- Permite votar en las predicciones sin cuenta: cualquier visitante queda
-- identificado por una cookie anónima (anonId) en vez de necesitar iniciar
-- sesión.
ALTER TABLE "predictions" ADD COLUMN "anonId" TEXT;
CREATE UNIQUE INDEX "predictions_anonId_matchId_key" ON "predictions"("anonId", "matchId");
