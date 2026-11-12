import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bandeja de notificaciones" };

export default async function NotificationsPage() {
  const { user } = await requireAuth();
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
    prisma.notification.count({ where: { recipientId: user.id, readAt: null } }),
  ]);
  return <div className="admin-page-stack">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Bandeja de entrada</h1>
      <p className="text-sm opacity-70">{unread} sin leer · últimas 100 comunicaciones</p></div>
      {unread > 0 && <form action={markAllNotificationsRead}>
        <button type="submit" className="btn btn-secondary">Marcar todas como leídas</button>
      </form>}
    </div>
    {items.length === 0 && <section className="card p-6"><p>Todavía no tenés notificaciones.</p></section>}
    <div className="space-y-3">
      {items.map(item => <article key={item.id} className={"card p-5 space-y-3 " + (!item.readAt ? "border-l-4 border-red-600" : "")}>
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase opacity-60">{item.type.replaceAll("_", " ")}</p>
          <h2 className="font-bold">{item.title}</h2></div>
          {!item.readAt && <span className="rounded-full bg-red-600 px-2 py-1 text-xs text-white">Nueva</span>}
        </div>
        <p className="text-sm whitespace-pre-wrap">{item.body}</p>
        <p className="text-xs opacity-60">Entregada al panel: {new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short", timeZone: "America/Asuncion" }).format(item.deliveredAt)}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {item.href && item.href.startsWith("/") && !item.href.startsWith("//") && <Link className="underline font-semibold" href={item.href}>Ver detalle</Link>}
          {!item.readAt && <form action={markNotificationRead}><input type="hidden" name="id" value={item.id}/><button className="underline" type="submit">Marcar como leída</button></form>}
        </div>
      </article>)}
    </div>
  </div>;
}
