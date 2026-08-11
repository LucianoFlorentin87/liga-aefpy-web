-- AlterTable
ALTER TABLE "match_cards" ADD COLUMN     "countedForSuspension" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tournament_settings" ADD COLUMN     "rulesPdfUrl" TEXT,
ALTER COLUMN "tournamentName" SET DEFAULT 'Liga AEFPY';

-- CreateTable
CREATE TABLE "point_adjustments" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "point_adjustments_teamId_idx" ON "point_adjustments"("teamId");

-- AddForeignKey
ALTER TABLE "point_adjustments" ADD CONSTRAINT "point_adjustments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_adjustments" ADD CONSTRAINT "point_adjustments_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
