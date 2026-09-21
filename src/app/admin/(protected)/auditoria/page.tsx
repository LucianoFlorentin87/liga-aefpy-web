import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { buildAuditWhere } from "@/lib/audit";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Auditoría" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Asuncion",
  }).format(date);
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; userId?: string; page?: string }>;
}) {
  await requirePermission("auditoria");
  const { from, to, userId, page: pageParam } = await searchParams;

  const page = Math.max(1, Number(pageParam) || 1);
  const where = buildAuditWhere({ from, to, userId });

  const [entries, total, users] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { firstName: true, lastName: true, username: true } } },
    }),
    prisma.activityLog.count({ where }),
    prisma.user.findMany({ orderBy: { firstName: "asc" }, select: { id: true, firstName: true, lastName: true, username: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const exportQuery = new URLSearchParams();
  if (from) exportQuery.set("from", from);
  if (to) exportQuery.set("to", to);
  if (userId) exportQuery.set("userId", userId);

  function pageHref(target: number) {
    const params = new URLSearchParams(exportQuery);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/admin/auditoria?${qs}` : "/admin/auditoria";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Auditoría</h1>
          <p className="text-sm text-[var(--color-gray-500)]">
            Historial de cambios realizados en el sistema desde el despliegue. {total} registro{total === 1 ? "" : "s"}
            {(from || to || userId) && " (con filtros aplicados)"}.
          </p>
        </div>
        <a href={`/admin/auditoria/export?${exportQuery.toString()}`} className="btn btn-outline">
          Descargar Excel
        </a>
      </div>

      <form method="GET" className="card grid grid-cols-1 gap-4 p-4 sm:grid-cols-4">
        <div>
          <label className="field-label">Desde</label>
          <input type="date" name="from" defaultValue={from ?? ""} className="input" />
        </div>
        <div>
          <label className="field-label">Hasta</label>
          <input type="date" name="to" defaultValue={to ?? ""} className="input" />
        </div>
        <div>
          <label className="field-label">Usuario</label>
          <select name="userId" defaultValue={userId ?? ""} className="input">
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.username})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn btn-primary">
            Filtrar
          </button>
          {(from || to || userId) && (
            <Link href="/admin/auditoria" className="btn btn-outline">
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="card p-3 sm:p-5">
        {entries.length === 0 ? (
          <EmptyState title="Sin datos registrados" hint="No hay actividad que coincida con los filtros." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap text-[var(--color-gray-500)]">{formatDateTime(entry.createdAt)}</td>
                    <td className="whitespace-nowrap font-semibold text-[var(--color-navy-900)]">
                      {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "—"}
                    </td>
                    <td>{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Link
            href={pageHref(page - 1)}
            className={`btn btn-outline ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
            aria-disabled={page <= 1}
          >
            ← Anterior
          </Link>
          <span className="text-sm text-[var(--color-gray-500)]">
            Página {page} de {totalPages}
          </span>
          <Link
            href={pageHref(page + 1)}
            className={`btn btn-outline ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
            aria-disabled={page >= totalPages}
          >
            Siguiente →
          </Link>
        </div>
      )}
    </div>
  );
}
