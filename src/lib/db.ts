import "server-only";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";
import { isLeagueModel, READ_OPERATIONS, scopeLeagueArgs } from "@/lib/season-scope";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
/** Unscoped client: lifecycle transactions and snapshot/export services only. */
export const seasonAdminDb = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = seasonAdminDb;

export const getCurrentSeasonId = cache(async () => {
  const settings = await seasonAdminDb.tournamentSettings.findUnique({ where: { id: "settings" }, select: { currentSeasonId: true } });
  if (!settings?.currentSeasonId) throw new Error("No hay una liga configurada.");
  return settings.currentSeasonId;
});

function createSeasonClient(fixedSeasonId?: string) {
  return seasonAdminDb.$extends({
    name: "league-season-isolation",
    query: { $allModels: { async $allOperations({ model, operation, args, query }) {
      if (!isLeagueModel(model)) return query(args);
      if (fixedSeasonId && !READ_OPERATIONS.has(operation)) throw new Error("El histórico es de solo lectura.");
      const seasonId = fixedSeasonId ?? await getCurrentSeasonId();
      const scoped = scopeLeagueArgs(model, operation, args as Record<string, unknown>, seasonId);
      return query(scoped as typeof args);
    } } },
  });
}
export const prisma = createSeasonClient();
/** Fixed season clients never permit writes; database triggers also protect closed rows. */
export const prismaForSeason = (seasonId: string) => createSeasonClient(seasonId);
export const getCurrentSeason = cache(async () => seasonAdminDb.season.findUniqueOrThrow({
  where: { id: await getCurrentSeasonId() },
  select: { id: true, name: true, slug: true, status: true, registrationOpen: true, registrationDeadline: true, createdAt: true, startedAt: true },
}));
