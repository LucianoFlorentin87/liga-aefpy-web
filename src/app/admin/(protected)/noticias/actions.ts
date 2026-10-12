"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { newsSchema } from "@/lib/validation";
import { saveNewsImage } from "@/lib/upload";

export type FormState = { error?: string; success?: string };

function revalidatePublic() {
  revalidatePath("/noticias");
  revalidatePath("/");
}

function parseNewsForm(formData: FormData) {
  return newsSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    sourceName: formData.get("sourceName"),
    sourceUrl: formData.get("sourceUrl"),
    publishedAt: formData.get("publishedAt"),
  });
}

export async function createNewsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("noticias");

  const parsed = parseNewsForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // La imagen puede venir de dos formas, nunca las dos: un archivo subido a
  // mano, o (cuando se importó desde una fuente externa) la URL de la
  // imagen original ya resuelta por el formulario en un campo oculto.
  let imageUrl: string | null = null;
  try {
    imageUrl = await saveNewsImage(formData.get("logo") as File | null);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo subir la imagen." };
  }
  if (!imageUrl) {
    const externalImageUrl = formData.get("externalImageUrl");
    imageUrl = typeof externalImageUrl === "string" && externalImageUrl.trim() ? externalImageUrl.trim() : null;
  }

  const news = await prisma.news.create({
    data: { ...parsed.data, imageUrl, featured: formData.get("featured") === "on" },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} cargó la noticia "${news.title}".`, actor.id);
  revalidatePath("/admin/noticias");
  revalidatePublic();
  return { success: "Noticia cargada." };
}

export async function updateNewsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { user: actor } = await requirePermission("noticias");
  const id = String(formData.get("id"));

  const target = await prisma.news.findUnique({ where: { id } });
  if (!target) return { error: "La noticia no existe." };

  const parsed = parseNewsForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let imageUrl = target.imageUrl;
  try {
    const uploaded = await saveNewsImage(formData.get("logo") as File | null);
    if (uploaded) imageUrl = uploaded;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo subir la imagen." };
  }

  await prisma.news.update({
    where: { id },
    data: { ...parsed.data, imageUrl, featured: formData.get("featured") === "on" },
  });

  await logActivity(`${actor.firstName} ${actor.lastName} editó la noticia "${parsed.data.title}".`, actor.id);
  revalidatePath("/admin/noticias");
  revalidatePublic();
  return { success: "Noticia actualizada." };
}

export async function toggleNewsFeaturedAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("noticias");
  const id = String(formData.get("id"));

  const target = await prisma.news.findUnique({ where: { id } });
  if (!target) return;

  await prisma.news.update({ where: { id }, data: { featured: !target.featured } });
  await logActivity(
    `${actor.firstName} ${actor.lastName} ${!target.featured ? "destacó" : "quitó de destacados"} la noticia "${target.title}".`,
    actor.id,
  );
  revalidatePath("/admin/noticias");
  revalidatePublic();
}

export async function deleteNewsAction(formData: FormData): Promise<void> {
  const { user: actor } = await requirePermission("noticias");
  const id = String(formData.get("id"));

  const target = await prisma.news.findUnique({ where: { id } });
  if (!target) return;

  await prisma.news.delete({ where: { id } });
  await logActivity(`${actor.firstName} ${actor.lastName} eliminó la noticia "${target.title}".`, actor.id);
  revalidatePath("/admin/noticias");
  revalidatePublic();
}
