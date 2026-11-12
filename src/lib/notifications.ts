import "server-only";
import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

/** Persist before any external email attempt. Only a committed row is an inbox delivery. */
export async function notifyTeamDelegates(input: {
  teamId: string; type: NotificationType; title: string; body: string;
  href?: string; sourceKey: string;
}) {
  const delegates = await prisma.user.findMany({
    where: { teamId: input.teamId, status: "ACTIVO", role: { key: "DELEGADO" } },
    select: { id: true },
  });
  if (!delegates.length) return 0;
  await prisma.notification.createMany({
    data: delegates.map(d => ({
      recipientId: d.id, type: input.type, title: input.title,
      body: input.body, href: input.href, sourceKey: input.sourceKey,
    })),
    skipDuplicates: true,
  });
  return delegates.length;
}

export async function notifyAllDelegates(input: {
  type: NotificationType; title: string; body: string; href?: string; sourceKey: string;
}) {
  const delegates = await prisma.user.findMany({
    where: { status: "ACTIVO", role: { key: "DELEGADO" } }, select: { id: true },
  });
  await prisma.notification.createMany({
    data: delegates.map(d => ({ recipientId: d.id, type: input.type,
      title: input.title, body: input.body, href: input.href, sourceKey: input.sourceKey })),
    skipDuplicates: true,
  });
  return delegates.length;
}
