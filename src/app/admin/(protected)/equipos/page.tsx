import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { TeamsManager } from "@/components/admin/TeamsManager";

export const metadata: Metadata = { title: "Equipos" };
export const dynamic = "force-dynamic";

export default async function AdminEquiposPage() {
  await requirePermission("equipos");

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true, homeMatches: true, awayMatches: true } } },
  });

  return <TeamsManager teams={teams} />;
}
