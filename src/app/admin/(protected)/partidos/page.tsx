import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { MatchesManager } from "@/components/admin/MatchesManager";

export const metadata: Metadata = { title: "Partidos" };
export const dynamic = "force-dynamic";

export default async function AdminPartidosPage() {
  await requirePermission("partidos");

  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      orderBy: [{ date: "desc" }, { time: "desc" }],
      include: { homeTeam: true, awayTeam: true, _count: { select: { goals: true, cards: true } } },
    }),
    prisma.team.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } }),
  ]);

  return <MatchesManager matches={matches} teams={teams} />;
}
