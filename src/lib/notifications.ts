import "server-only";
import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";
import { Resend } from "resend";

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

/** Best-effort email delivery for pending inbox messages; safe to retry. */
export async function sendPendingNotificationEmails(limit = 30) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { sent: 0, skipped: "Falta RESEND_API_KEY o EMAIL_FROM" };
  const client = new Resend(apiKey);
  const pending = await prisma.notification.findMany({
    where: { emailSentAt: null },
    orderBy: { createdAt: "asc" }, take: Math.min(Math.max(limit, 1), 100),
    include: { recipient: { select: { email: true } } },
  });
  let sent = 0;
  for (const item of pending) {
    try {
      // Avoid including confidential case details or sanctions in external email.
      const { error } = await client.emails.send({
        from, to: item.recipient.email,
        subject: "Nueva notificación — Liga AEFPY",
        text: "Tenés una nueva comunicación oficial en la bandeja de entrada de tu panel AEFPY. Ingresá al sitio oficial e iniciá sesión para leerla.",
      });
      if (error) throw new Error(error.message);
      await prisma.notification.update({ where: { id: item.id }, data: { emailSentAt: new Date(), emailError: null } });
      sent++;
    } catch (e) {
      await prisma.notification.update({ where: { id: item.id }, data: { emailError: String(e).slice(0, 400) } });
    }
  }
  return { sent, attempted: pending.length };
}
