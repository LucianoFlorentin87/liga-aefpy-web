"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";

export async function markNotificationRead(formData: FormData) {
  const { user } = await requireAuth();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.notification.updateMany({
    where: { id, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin/notificaciones");
}

export async function markAllNotificationsRead() {
  const { user } = await requireAuth();
  await prisma.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin/notificaciones");
}
