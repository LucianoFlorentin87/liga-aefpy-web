import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PointAdjustmentsManager } from "@/components/admin/PointAdjustmentsManager";

export const metadata: Metadata = { title: "Ajustes de puntos" };
export const dynamic = "force-dynamic";

export default async function AjustesPuntosPage() {
  await requirePermission("ajustesPuntos");

  const [adjustments, teams] = await Promise.all([
    prisma.pointAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      include: { team: true, match: { include: { homeTeam: true, awayTeam: true } } },
    }),
    prisma.team.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } }),
  ]);

  return <PointAdjustmentsManager adjustments={adjustments} teams={teams} />;
}
