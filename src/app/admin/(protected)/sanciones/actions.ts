"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { sanctionSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

export async function createSanctionAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("sanciones");

  const parsed = sanctionSchema.safeParse({
    playerId: formData.get("playerId"),
    reason: formData.get("reason"),
    matchesCount: formData.get("matchesCount"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const player = await prisma.player.findUnique({ where: { id: parsed.data.playerId } });
  if (!player) return { error: "El jugador no existe." };

  await prisma.sanction.create({
    data: {
      playerId: player.id,
      teamId: player.teamId,
      reason: parsed.data.reason,
      matchesCount: parsed.data.matchesCount,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} registró una sanción para ${player.firstName} ${player.lastName}.`, actor.id);
  revalidatePath("/admin/sanciones");
  revalidatePath(`/admin/jugadores/${player.id}`);
  return { success: "Sanción registrada." };
}

export async function updateSanctionAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("sanciones");
  const id = String(formData.get("id"));

  const parsed = sanctionSchema.safeParse({
    playerId: formData.get("playerId"),
    reason: formData.get("reason"),
    matchesCount: formData.get("matchesCount"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const target = await prisma.sanction.findUnique({ where: { id } });
  if (!target) return { error: "La sanción no existe." };

  const player = await prisma.player.findUnique({ where: { id: parsed.data.playerId } });
  if (!player) return { error: "El jugador no existe." };

  await prisma.sanction.update({
    where: { id },
    data: {
      playerId: player.id,
      teamId: player.teamId,
      reason: parsed.data.reason,
      matchesCount: parsed.data.matchesCount,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      status: parsed.data.status,
    },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} actualizó una sanción de ${player.firstName} ${player.lastName}.`, actor.id);
  revalidatePath("/admin/sanciones");
  revalidatePath(`/admin/jugadores/${player.id}`);
  return { success: "Sanción actualizada." };
}

export async function deleteSanctionAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("sanciones");
  const id = String(formData.get("id"));

  const target = await prisma.sanction.findUnique({ where: { id }, include: { player: true } });
  if (!target) return;

  await prisma.sanction.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó una sanción de ${target.player.firstName} ${target.player.lastName}.`, actor.id);
  revalidatePath("/admin/sanciones");
  revalidatePath(`/admin/jugadores/${target.playerId}`);
}
