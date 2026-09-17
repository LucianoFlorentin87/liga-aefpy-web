import "server-only";
import { prisma } from "@/lib/db";

/**
 * Revisa las sanciones ACTIVAS y marca como CUMPLIDA las que ya cubrieron
 * los partidos que tenían que cubrir: cuenta los partidos FINALIZADO del
 * equipo del jugador, desde que arrancó la sanción, en los que el jugador
 * NO participó (sin registro en MatchParticipation) — se asume que no jugó
 * porque estaba suspendido. Se recalcula desde cero cada vez en vez de
 * llevar un contador que se pueda desincronizar, así que es seguro llamarla
 * las veces que haga falta (después de cualquier acción que pueda dejar un
 * partido en FINALIZADO).
 */
export async function reconcileSanctions(): Promise<void> {
  const activeSanctions = await prisma.sanction.findMany({ where: { status: "ACTIVA" } });
  if (activeSanctions.length === 0) return;

  for (const sanction of activeSanctions) {
    const servedMatches = await prisma.match.findMany({
      where: {
        status: "FINALIZADO",
        date: { gte: sanction.startDate },
        OR: [{ homeTeamId: sanction.teamId }, { awayTeamId: sanction.teamId }],
        participations: { none: { playerId: sanction.playerId } },
      },
      orderBy: { date: "asc" },
      take: sanction.matchesCount,
      select: { date: true },
    });

    if (servedMatches.length >= sanction.matchesCount) {
      await prisma.sanction.update({
        where: { id: sanction.id },
        data: { status: "CUMPLIDA", endDate: servedMatches[servedMatches.length - 1].date },
      });
    }
  }
}
