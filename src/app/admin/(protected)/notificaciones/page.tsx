import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bandeja de notificaciones" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filtro?: string; pagina?: string }> }) {
  const params = await searchParams;
  const filter = params.filtro === "sin-leer" ? "sin-leer" : "todas";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.pagina ?? "1", 10) || 1));
  const pageSize = 30;
  const { user } = await requireAuth();
  const where = { recipientId: user.id, ...(filter === "sin-leer" ? { readAt: null } : {}) };
  const [items, unread, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.notification.count({ where: { recipientId: user.id, readAt: null } }),
    prisma.notification.count({ where }),
  ]);
  return <div className="admin-page-stack">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Bandeja de entrada</h1>
      <p className="text-sm opacity-70">{unread} sin leer · {total} comunicaciones en esta vista</p></div>
      {unread > 0 && <form action={markAllNotificationsRead}>
        <button type="submit" className="btn btn-outline">Marcar todas como leídas</button>
      </form>}
    </div>
    <nav aria-label="Filtros de notificaciones" className="flex gap-4 text-sm"><Link href="/admin/notificaciones" aria-current={filter === "todas" ? "page" : undefined} className="underline">Todas</Link><Link href="/admin/notificaciones?filtro=sin-leer" aria-current={filter === "sin-leer" ? "page" : undefined} className="underline">Sin leer</Link></nav>
    {items.length === 0 && <section className="card p-6"><p>Todavía no tenés notificaciones.</p></section>}
    <div className="space-y-3">
      {items.map(item => <article key={item.id} className={"card p-5 space-y-3 " + (!item.readAt ? "border-l-4 border-[var(--arena-accent)]" : "")}>
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase opacity-60">{item.type.replaceAll("_", " ")}</p>
          <h2 className="font-bold">{item.title}</h2></div>
          {!item.readAt && <span className="badge badge-green">Nueva</span>}
        </div>
        <p className="text-sm whitespace-pre-wrap">{item.body}</p>
        <p className="text-xs opacity-60">Entregada al panel: {new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short", timeZone: "America/Asuncion" }).format(item.deliveredAt)}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {item.href && item.href.startsWith("/") && !item.href.startsWith("//") && <Link className="underline font-semibold" href={item.href}>Ver detalle</Link>}
          {!item.readAt && <form action={markNotificationRead}><input type="hidden" name="id" value={item.id}/><button className="underline" type="submit">Marcar como leída</button></form>}
        </div>
      </article>)}
    </div>
    <nav aria-label="Páginas de notificaciones" className="flex items-center gap-4 text-sm">
      {page > 1 && <Link className="underline" href={`/admin/notificaciones?filtro=${filter}&pagina=${page - 1}`}>Anterior</Link>}
      <span>Página {page} de {Math.max(1, Math.ceil(total / pageSize))}</span>
      {page * pageSize < total && <Link className="underline" href={`/admin/notificaciones?filtro=${filter}&pagina=${page + 1}`}>Siguiente</Link>}
    </nav>
  </div>;
}
