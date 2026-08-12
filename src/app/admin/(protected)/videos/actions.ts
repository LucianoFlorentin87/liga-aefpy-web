"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { videoSchema } from "@/lib/validation";

export type FormState = { error?: string; success?: string };

function revalidatePublic() {
  revalidatePath("/videos");
  revalidatePath("/");
}

export async function createVideoAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("videos");

  const parsed = videoSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const video = await prisma.video.create({
    data: { ...parsed.data, featured: formData.get("featured") === "on" },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} cargó el video "${video.title}".`, actor.id);
  revalidatePath("/admin/videos");
  revalidatePublic();
  return { success: "Video cargado." };
}

export async function updateVideoAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("videos");
  const id = String(formData.get("id"));

  const parsed = videoSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const target = await prisma.video.findUnique({ where: { id } });
  if (!target) return { error: "El video no existe." };

  await prisma.video.update({
    where: { id },
    data: { ...parsed.data, featured: formData.get("featured") === "on" },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} editó el video "${parsed.data.title}".`, actor.id);
  revalidatePath("/admin/videos");
  revalidatePublic();
  return { success: "Video actualizado." };
}

export async function toggleVideoFeaturedAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("videos");
  const id = String(formData.get("id"));

  const target = await prisma.video.findUnique({ where: { id } });
  if (!target) return;

  await prisma.video.update({ where: { id }, data: { featured: !target.featured } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} ${!target.featured ? "destacó" : "quitó de destacados"} el video "${target.title}".`,
    actor.id,
  );
  revalidatePath("/admin/videos");
  revalidatePublic();
}

export async function deleteVideoAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("videos");
  const id = String(formData.get("id"));

  const target = await prisma.video.findUnique({ where: { id } });
  if (!target) return;

  await prisma.video.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó el video "${target.title}".`, actor.id);
  revalidatePath("/admin/videos");
  revalidatePublic();
}
