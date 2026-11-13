CREATE TYPE "NotificationType" AS ENUM ('INSCRIPCION','CALENDARIO','RESULTADO','DISCIPLINA','RECLAMO','COMITE','TORNEO','PREMIO','COMUNICADO');
CREATE TABLE "notifications" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "recipientId" TEXT NOT NULL,
 "type" "NotificationType" NOT NULL,
 "title" TEXT NOT NULL,
 "body" TEXT NOT NULL,
 "href" TEXT,
 "sourceKey" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "readAt" TIMESTAMP(3),
 "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "notifications_recipientId_createdAt_idx" ON "notifications"("recipientId","createdAt" DESC);
CREATE INDEX "notifications_recipientId_readAt_idx" ON "notifications"("recipientId","readAt");
CREATE UNIQUE INDEX "notifications_recipientId_sourceKey_key" ON "notifications"("recipientId","sourceKey");