-- Permite que las predicciones también las voten usuarios de staff con rol
-- DELEGADO, no sólo cuentas de hincha (FanUser). Se agrega una segunda
-- relación opcional (staffUserId) en vez de reemplazar la existente, para
-- no perder los votos de hinchas ya cargados.

-- 1) Renombrar la columna/FK/índice existentes de FanUser: userId -> fanUserId
ALTER TABLE "predictions" RENAME COLUMN "userId" TO "fanUserId";
ALTER TABLE "predictions" ALTER COLUMN "fanUserId" DROP NOT NULL;

ALTER TABLE "predictions" DROP CONSTRAINT "predictions_userId_fkey";
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_fanUserId_fkey"
  FOREIGN KEY ("fanUserId") REFERENCES "fan_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "predictions_userId_matchId_key";
CREATE UNIQUE INDEX "predictions_fanUserId_matchId_key" ON "predictions"("fanUserId", "matchId");

-- 2) Nueva columna opcional para votos de staff (DELEGADO)
ALTER TABLE "predictions" ADD COLUMN "staffUserId" TEXT;

ALTER TABLE "predictions" ADD CONSTRAINT "predictions_staffUserId_fkey"
  FOREIGN KEY ("staffUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "predictions_staffUserId_matchId_key" ON "predictions"("staffUserId", "matchId");
