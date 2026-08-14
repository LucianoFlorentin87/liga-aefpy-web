"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { goalSchema, cardSchema } from "@/lib/validation";
import { playerFullName } from "@/lib/format";
import type { MatchStatus } from "@prisma/client";

export type FormState = { error?: string; success?: string };

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/fixture");
  revalidatePath("/resultados");
  revalidatePath("/posiciones");
  revalidatePath("/goleadores");
  revalidatePath("/disciplina");
  revalidatePath("/equipos");
}

async function assertPlayerOnTeamInMatch(matchId: string, playerId: string, teamId: string) {
  const [match, player] = await Promise.all([
    prisma.match.findUnique({ where: { id: matchId } }),
    prisma.player.findUnique({ where: { id: playerId } }),
  ]);
  if (!match) throw new Error("El partido no existe.");
  if (!player) throw new Error("El jugador no existe.");
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("El equipo no participa en este partido.");
  }
  if (player.teamId !== teamId) {
    throw new Error("El jugador no pertenece al equipo seleccionado.");
  }
  return match;
}

/**
 * Régimen disciplinario automático (Art. 8 del reglamento):
 * - Tarjeta roja: 1 partido de suspensión automático.
 * - 3 tarjetas amarillas acumuladas (mismo jugador): 1 partido de
 *   suspensión automático, y esas 3 amarillas quedan "consumidas" para no
 *   volver a contarlas en una futura acumulación.
 * Devuelve un mensaje para mostrar en el formulario si se generó una
 * sanción, o null si no correspondía.
 */
async function maybeAutoSuspend(params: {
  playerId: string;
  teamId: string;
  cardType: "AMARILLA" | "ROJA";
  actorId: string;
  playerName: string;
}): Promise<string | null> {
  const { playerId, teamId, cardType, actorId, playerName } = params;
  const today = new Date();

  if (cardType === "ROJA") {
    await prisma.sanction.create({
      data: {
        playerId,
        teamId,
        reason: "Tarjeta roja (Art. 8.1 del reglamento) — suspensión automática",
        matchesCount: 1,
        startDate: today,
        status: "ACTIVA",
      },
    });
    await logActivity(`Suspensión automática (1 partido) para ${playerName} por tarjeta roja.`, actorId);
    return "Tarjeta roja registrada. Se generó una suspensión automática de 1 partido (Art. 8.1).";
  }

  const unconsumedYellows = await prisma.matchCard.findMany({
    where: { playerId, type: "AMARILLA", countedForSuspension: false },
    orderBy: { createdAt: "asc" },
  });

  if (unconsumedYellows.length >= 3) {
    const cardsToConsume = unconsumedYellows.slice(0, 3);
    await prisma.$transaction([
      prisma.matchCard.updateMany({
        where: { id: { in: cardsToConsume.map((c) => c.id) } },
        data: { countedForSuspension: true },
      }),
      prisma.sanction.create({
        data: {
          playerId,
          teamId,
          reason: "Acumulación de 3 tarjetas amarillas (Art. 8.2 del reglamento) — suspensión automática",
          matchesCount: 1,
          startDate: today,
          status: "ACTIVA",
        },
      }),
    ]);
    await logActivity(
      `Suspensión automática (1 partido) para ${playerName} por acumulación de 3 tarjetas amarillas.`,
      actorId,
    );
    return "Tarjeta amarilla registrada. El jugador acumuló 3 amarillas: se generó una suspensión automática de 1 partido (Art. 8.2).";
  }

  return null;
}

export async function setParticipationAction(formData: FormData): Promise<void> {
  await requirePermission("resultados");
  const matchId = String(formData.get("matchId"));
  const playerId = String(formData.get("playerId"));
  const teamId = String(formData.get("teamId"));
  const isStarter = formData.get("isStarter") === "on";

  await assertPlayerOnTeamInMatch(matchId, playerId, teamId);

  await prisma.matchParticipation.upsert({
    where: { matchId_playerId: { matchId, playerId } },
    update: { isStarter },
    create: { matchId, playerId, teamId, isStarter },
  });

  revalidatePath(`/admin/partidos/${matchId}`);
}

export async function removeParticipationAction(formData: FormData): Promise<void> {
  await requirePermission("resultados");
  const matchId = String(formData.get("matchId"));
  const playerId = String(formData.get("playerId"));

  await prisma.matchParticipation.deleteMany({ where: { matchId, playerId } });
  revalidatePath(`/admin/partidos/${matchId}`);
}

export async function addGoalAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("resultados");

  const parsed = goalSchema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    minute: formData.get("minute"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    await assertPlayerOnTeamInMatch(parsed.data.matchId, parsed.data.playerId, parsed.data.teamId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Datos inválidos" };
  }

  const player = await prisma.player.findUnique({ where: { id: parsed.data.playerId } });
  await prisma.matchGoal.create({ data: parsed.data });
  await prisma.matchParticipation.upsert({
    where: { matchId_playerId: { matchId: parsed.data.matchId, playerId: parsed.data.playerId } },
    update: {},
    create: { matchId: parsed.data.matchId, playerId: parsed.data.playerId, teamId: parsed.data.teamId },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} registró un gol de ${player ? playerFullName(player) : "un jugador"}.`, actor.id);
  revalidatePath(`/admin/partidos/${parsed.data.matchId}`);
  revalidatePublic();
  return { success: "Gol registrado." };
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("resultados");
  const id = String(formData.get("id"));
  const matchId = String(formData.get("matchId"));

  const goal = await prisma.matchGoal.findUnique({ where: { id }, include: { player: true } });
  if (!goal) return;

  await prisma.matchGoal.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó un gol de ${playerFullName(goal.player)}.`, actor.id);
  revalidatePath(`/admin/partidos/${matchId}`);
  revalidatePublic();
}

export async function addCardAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("resultados");

  const parsed = cardSchema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
    teamId: formData.get("teamId"),
    type: formData.get("type"),
    minute: formData.get("minute"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    await assertPlayerOnTeamInMatch(parsed.data.matchId, parsed.data.playerId, parsed.data.teamId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Datos inválidos" };
  }

  const player = await prisma.player.findUnique({ where: { id: parsed.data.playerId } });
  await prisma.matchCard.create({
    data: { ...parsed.data, note: parsed.data.note || null },
  });
  await prisma.matchParticipation.upsert({
    where: { matchId_playerId: { matchId: parsed.data.matchId, playerId: parsed.data.playerId } },
    update: {},
    create: { matchId: parsed.data.matchId, playerId: parsed.data.playerId, teamId: parsed.data.teamId },
  });

  await logActivity(
    `${actor.firstName} ${actor.lastName} registró tarjeta ${parsed.data.type === "AMARILLA" ? "amarilla" : "roja"} a ${player ? playerFullName(player) : "un jugador"}.`,
    actor.id,
  );

  const autoSuspensionMessage = await maybeAutoSuspend({
    playerId: parsed.data.playerId,
    teamId: parsed.data.teamId,
    cardType: parsed.data.type,
    actorId: actor.id,
    playerName: player ? playerFullName(player) : "El jugador",
  });

  revalidatePath(`/admin/partidos/${parsed.data.matchId}`);
  revalidatePath("/admin/sanciones");
  revalidatePublic();
  return { success: autoSuspensionMessage ?? "Tarjeta registrada." };
}

export async function deleteCardAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("resultados");
  const id = String(formData.get("id"));
  const matchId = String(formData.get("matchId"));

  const card = await prisma.matchCard.findUnique({ where: { id }, include: { player: true } });
  if (!card) return;

  await prisma.matchCard.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó una tarjeta de ${playerFullName(card.player)}.`, actor.id);
  revalidatePath(`/admin/partidos/${matchId}`);
  revalidatePublic();
}

const SETTABLE_STATUSES: MatchStatus[] = ["PROGRAMADO", "EN_CURSO", "FINALIZADO", "SUSPENDIDO", "REPROGRAMADO"];

export async function setMatchStatusAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("resultados");
  const matchId = String(formData.get("matchId"));
  const status = String(formData.get("status")) as MatchStatus;

  if (!SETTABLE_STATUSES.includes(status)) return;

  const match = await prisma.match.update({ where: { id: matchId }, data: { status }, include: { homeTeam: true, awayTeam: true } });
  await logActivity(`${actor.firstName} ${actor.lastName} marcó ${match.homeTeam.name} vs ${match.awayTeam.name} como "${status}".`, actor.id);
  revalidatePath(`/admin/partidos/${matchId}`);
  revalidatePath("/admin/partidos");
  revalidatePath("/admin/resultados");
  revalidatePublic();
}
