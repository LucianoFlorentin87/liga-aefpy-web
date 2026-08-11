"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { pointAdjustmentSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/posiciones");
}

export async function createPointAdjustmentAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("ajustesPuntos");

  const parsed = pointAdjustmentSchema.safeParse({
    teamId: formData.get("teamId"),
    points: formData.get("points"),
    reason: formData.get("reason"),
    matchId: formData.get("matchId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
  if (!team) return { error: "El equipo no existe." };

  await prisma.pointAdjustment.create({
    data: {
      teamId: team.id,
      points: parsed.data.points,
      reason: parsed.data.reason,
      matchId: parsed.data.matchId || null,
    },
  });

  await logActivity(
    `${actor.firstName} ${actor.lastName} aplicó un ajuste de ${parsed.data.points > 0 ? "+" : ""}${parsed.data.points} punto(s) a ${team.name} (${parsed.data.reason}).`,
    actor.id,
  );
  revalidatePath("/admin/ajustes-puntos");
  revalidatePublic();
  return { success: "Ajuste registrado." };
}

export async function deletePointAdjustmentAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("ajustesPuntos");
  const id = String(formData.get("id"));

  const target = await prisma.pointAdjustment.findUnique({ where: { id }, include: { team: true } });
  if (!target) return;

  await prisma.pointAdjustment.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó un ajuste de puntos de ${target.team.name}.`, actor.id);
  revalidatePath("/admin/ajustes-puntos");
  revalidatePublic();
}
