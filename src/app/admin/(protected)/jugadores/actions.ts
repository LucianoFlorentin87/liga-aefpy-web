"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { playerSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

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

  const player = await prisma.player.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      jerseyNumber: parsed.data.jerseyNumber,
      position: parsed.data.position,
      teamId: parsed.data.teamId,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} creó el jugador "${player.firstName} ${player.lastName}".`, actor.id);
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
      lastName: parsed.data.lastName,
      jerseyNumber: parsed.data.jerseyNumber,
      position: parsed.data.position,
      teamId: parsed.data.teamId,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} editó el jugador "${parsed.data.firstName} ${parsed.data.lastName}".`, actor.id);
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
    `${actor.firstName} ${actor.lastName} ${newStatus === "ACTIVO" ? "activó" : "desactivó"} el jugador "${target.firstName} ${target.lastName}".`,
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
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó el jugador "${target.firstName} ${target.lastName}".`, actor.id);
  revalidatePath("/admin/jugadores");
}
