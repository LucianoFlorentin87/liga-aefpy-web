"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { rulesSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

export async function updateRulesAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("reglamento");

  const parsed = rulesSchema.safeParse({ rulesContent: formData.get("rulesContent") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.tournamentSettings.upsert({
    where: { id: "settings" },
    update: { rulesContent: parsed.data.rulesContent },
    create: { id: "settings", rulesContent: parsed.data.rulesContent },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} actualizó el reglamento del torneo.`, actor.id);
  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
  return { success: "Reglamento actualizado." };
}
