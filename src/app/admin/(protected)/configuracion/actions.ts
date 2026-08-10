"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { settingsSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

export async function updateSettingsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("configuracion");

  const parsed = settingsSchema.safeParse({
    tournamentName: formData.get("tournamentName"),
    standingsCriteria: formData.get("standingsCriteria"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.tournamentSettings.upsert({
    where: { id: "settings" },
    update: parsed.data,
    create: { id: "settings", ...parsed.data },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} actualizó la configuración del torneo.`, actor.id);
  revalidatePath("/admin/configuracion");
  revalidatePath("/");
  revalidatePath("/posiciones");
  return { success: "Configuración guardada." };
}
