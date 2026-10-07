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
    orgName: formData.get("orgName"),
    orgTagline: formData.get("orgTagline"),
    heroSubtitle: formData.get("heroSubtitle"),
    footerDescription: formData.get("footerDescription"),
    standingsCriteria: formData.get("standingsCriteria"),
    maintenanceMessage: formData.get("maintenanceMessage"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  // Checkbox: ausente en el FormData cuando está destildado, no llega "false".
  const maintenanceMode = formData.get("maintenanceMode") === "on";

  const previous = await prisma.tournamentSettings.findUnique({ where: { id: "settings" } });

  await prisma.tournamentSettings.upsert({
    where: { id: "settings" },
    update: { ...parsed.data, maintenanceMode },
    create: { id: "settings", ...parsed.data, maintenanceMode },
  });

  if (maintenanceMode !== (previous?.maintenanceMode ?? false)) {
    await logActivity(
      `${actor.firstName} ${actor.lastName} ${maintenanceMode ? "activó" : "desactivó"} el modo mantenimiento del sitio.`,
      actor.id,
    );
  } else {
    await logActivity(`${actor.firstName} ${actor.lastName} actualizó la configuración del torneo.`, actor.id);
  }
  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/posiciones");
  return { success: "Configuración guardada." };
}
