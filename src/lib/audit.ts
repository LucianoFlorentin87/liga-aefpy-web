import "server-only";
import type { Prisma } from "@prisma/client";

export type AuditFilters = {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  userId?: string;
};

/**
 * Arma el where de Prisma para el log de auditoría a partir de los filtros
 * de la URL. Se comparte entre la página (paginada) y la exportación a
 * Excel (todo lo que matchee, sin paginar) para que ambas apliquen
 * exactamente el mismo criterio.
 */
export function buildAuditWhere(filters: AuditFilters): Prisma.ActivityLogWhereInput {
  const where: Prisma.ActivityLogWhereInput = {};
  if (filters.userId) where.userId = filters.userId;

  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.from) createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) {
      const end = new Date(`${filters.to}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1); // el filtro "hasta" incluye todo ese día
      createdAt.lt = end;
    }
    where.createdAt = createdAt;
  }

  return where;
}
