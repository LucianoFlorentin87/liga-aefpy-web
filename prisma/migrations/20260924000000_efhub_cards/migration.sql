-- Carta de eFootball (eFHUB) elegida para cada jugador, sólo a título
-- visual/decorativo (no afecta ninguna regla del torneo).
CREATE TABLE "efhub_cards" (
    "id" TEXT NOT NULL,
    "efhubId" TEXT,
    "name" TEXT NOT NULL,
    "overall" INTEGER,
    "position" TEXT,
    "cardType" TEXT,
    "playstyle" TEXT,
    "club" TEXT,
    "league" TEXT,
    "nationality" TEXT,
    "cardImageUrl" TEXT,
    "playerImageUrl" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "efhub_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "efhub_cards_efhubId_key" ON "efhub_cards"("efhubId");
CREATE INDEX "efhub_cards_name_idx" ON "efhub_cards"("name");

ALTER TABLE "players" ADD COLUMN "efhubCardId" TEXT;
ALTER TABLE "players" ADD CONSTRAINT "players_efhubCardId_fkey" FOREIGN KEY ("efhubCardId") REFERENCES "efhub_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "players_efhubCardId_idx" ON "players"("efhubCardId");
