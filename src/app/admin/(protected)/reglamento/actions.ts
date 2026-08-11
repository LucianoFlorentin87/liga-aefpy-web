"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { rulesSchema } from "@/lib/validation";
import { saveRulesPdf } from "@/lib/upload";

export type FormState = { error?: string; success?: string };

export async function updateRulesAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("reglamento");

  const parsed = rulesSchema.safeParse({ rulesContent: formData.get("rulesContent") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  let rulesPdfUrl: string | undefined;
  try {
    const uploaded = await saveRulesPdf(formData.get("rulesPdf") as File | null);
    if (uploaded) rulesPdfUrl = uploaded;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir el PDF." };
  }

  await prisma.tournamentSettings.upsert({
    where: { id: "settings" },
    update: { rulesContent: parsed.data.rulesContent ?? "", ...(rulesPdfUrl ? { rulesPdfUrl } : {}) },
    create: { id: "settings", rulesContent: parsed.data.rulesContent ?? "", rulesPdfUrl },
  });

  await logActivity(
    `${actor.firstName} ${actor.lastName} actualizó el reglamento del torneo${rulesPdfUrl ? " (subió un PDF nuevo)" : ""}.`,
    actor.id,
  );
  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
  return { success: "Reglamento actualizado." };
}

export async function removeRulesPdfAction(): Promise<void> {
  const { user: actor } = await requirePermission("reglamento");

  await prisma.tournamentSettings.upsert({
    where: { id: "settings" },
    update: { rulesPdfUrl: null },
    create: { id: "settings", rulesPdfUrl: null },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} quitó el PDF del reglamento.`, actor.id);
  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
}
