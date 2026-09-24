"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { playerSchema } from "@/lib/validation";
import { playerFullName } from "@/lib/format";

export type FormState = { error?: string; success?: string };

export type EfhubCardInput = {
  efhubId: string;
  name: string;
  overall: number | null;
  position: string | null;
  cardType: string | null;
  playstyle: string | null;
  club: string | null;
  league: string | null;
  nationality: string | null;
  cardImageUrl: string | null;
  playerImageUrl: string | null;
  sourceUrl: string | null;
};

/**
 * Guarda (o actualiza) la carta de eFHUB una sola vez por efhubId, para no
 * duplicarla si dos jugadores eligen la misma o si se la vuelve a buscar
 * después. Compartido entre el alta de jugador (elegís la carta al crear)
 * y setPlayerEfhubCardAction (la cambiás editando un jugador existente).
 */
async function upsertEfhubCard(card: EfhubCardInput) {
  const cardData = {
    name: card.name,
    overall: card.overall,
    position: card.position,
    cardType: card.cardType,
    playstyle: card.playstyle,
    club: card.club,
    league: card.league,
    nationality: card.nationality,
    cardImageUrl: card.cardImageUrl,
    playerImageUrl: card.playerImageUrl,
    sourceUrl: card.sourceUrl,
  };
  return prisma.efhubCard.upsert({
    where: { efhubId: card.efhubId },
    update: cardData,
    create: { efhubId: card.efhubId, ...cardData },
  });
}

export async function createPlayerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("jugadores");

  const parsed = playerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    teamId: formData.get("teamId"),
    birthDate: formData.get("birthDate"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
  if (!team) return { error: "El equipo seleccionado no existe." };

  const duplicateNumber = await prisma.player.findFirst({
    where: { teamId: parsed.data.teamId, jerseyNumber: parsed.data.jerseyNumber, status: "ACTIVO" },
  });
  if (duplicateNumber) return { error: `Ya hay un jugador activo con el número ${parsed.data.jerseyNumber} en ${team.name}.` };

  // Carta de eFHUB elegida (opcional) al crear el jugador — ver EfhubCardPicker en modo "create".
  let efhubCardId: string | undefined;
  const efhubCardRaw = formData.get("efhubCard");
  if (typeof efhubCardRaw === "string" && efhubCardRaw) {
    const efhubCard = await upsertEfhubCard(JSON.parse(efhubCardRaw) as EfhubCardInput);
    efhubCardId = efhubCard.id;
  }

  const player = await prisma.player.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      jerseyNumber: parsed.data.jerseyNumber,
      position: parsed.data.position,
      teamId: parsed.data.teamId,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      status: parsed.data.status,
      efhubCardId,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} creó el jugador "${playerFullName(player)}".`, actor.id);
  revalidatePath("/admin/jugadores");
  revalidatePath("/equipos");
  return { success: "Jugador creado." };
}

export async function updatePlayerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("jugadores");
  const id = String(formData.get("id"));

  const parsed = playerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    teamId: formData.get("teamId"),
    birthDate: formData.get("birthDate"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const target = await prisma.player.findUnique({ where: { id } });
  if (!target) return { error: "El jugador no existe." };

  const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
  if (!team) return { error: "El equipo seleccionado no existe." };

  const duplicateNumber = await prisma.player.findFirst({
    where: { teamId: parsed.data.teamId, jerseyNumber: parsed.data.jerseyNumber, status: "ACTIVO", NOT: { id } },
  });
  if (duplicateNumber) return { error: `Ya hay un jugador activo con el número ${parsed.data.jerseyNumber} en ${team.name}.` };

  await prisma.player.update({
    where: { id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      jerseyNumber: parsed.data.jerseyNumber,
      position: parsed.data.position,
      teamId: parsed.data.teamId,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} editó el jugador "${playerFullName(parsed.data)}".`, actor.id);
  revalidatePath("/admin/jugadores");
  revalidatePath("/equipos");
  return { success: "Jugador actualizado." };
}

export async function togglePlayerStatusAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("jugadores");
  const id = String(formData.get("id"));

  const target = await prisma.player.findUnique({ where: { id } });
  if (!target) return;

  const newStatus = target.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
  await prisma.player.update({ where: { id }, data: { status: newStatus } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} ${newStatus === "ACTIVO" ? "activó" : "desactivó"} el jugador "${playerFullName(target)}".`,
    actor.id,
  );
  revalidatePath("/admin/jugadores");
}

export async function deletePlayerAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("jugadores");
  const id = String(formData.get("id"));

  const target = await prisma.player.findUnique({
    where: { id },
    include: { _count: { select: { goals: true, cards: true, sanctions: true, participations: true } } },
  });
  if (!target) return;

  const hasRelated =
    target._count.goals > 0 || target._count.cards > 0 || target._count.sanctions > 0 || target._count.participations > 0;
  if (hasRelated) return; // hay que desactivar, no eliminar

  await prisma.player.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó el jugador "${playerFullName(target)}".`, actor.id);
  revalidatePath("/admin/jugadores");
}

function revalidateEfhubCardViews() {
  revalidatePath("/admin/jugadores");
  revalidatePath("/goleadores");
  revalidatePath("/disciplina");
  revalidatePath("/equipos");
}

/**
 * Le asigna a un jugador la carta de eFHUB elegida por el admin (ver
 * /admin/jugadores/efhub-search). Guarda la carta una sola vez por
 * efhubId (upsert) para no duplicarla si dos jugadores eligen la misma, o
 * si se la vuelve a buscar después.
 */
export async function setPlayerEfhubCardAction(playerId: string, card: EfhubCardInput): Promise<{ error?: string }> {
  const { user: actor } = await requirePermission("jugadores");

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { error: "El jugador no existe." };

  const efhubCard = await upsertEfhubCard(card);

  await prisma.player.update({ where: { id: playerId }, data: { efhubCardId: efhubCard.id } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} le asignó la carta de eFHUB "${card.name}" a ${playerFullName(player)}.`,
    actor.id,
  );
  revalidateEfhubCardViews();
  return {};
}

export async function clearPlayerEfhubCardAction(playerId: string): Promise<void> {
  const { user: actor } = await requirePermission("jugadores");

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return;

  await prisma.player.update({ where: { id: playerId }, data: { efhubCardId: null } });
  await logActivity(`${actor.firstName} ${actor.lastName} le quitó la carta de eFHUB a ${playerFullName(player)}.`, actor.id);
  revalidateEfhubCardViews();
}
