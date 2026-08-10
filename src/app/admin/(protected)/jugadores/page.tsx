import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PlayersManager } from "@/components/admin/PlayersManager";

export const metadata: Metadata = { title: "Jugadores" };
export const dynamic = "force-dynamic";

export default async function AdminJugadoresPage() {
  await requirePermission("jugadores");

  const [players, teams] = await Promise.all([
    prisma.player.findMany({
      orderBy: [{ team: { name: "asc" } }, { jerseyNumber: "asc" }],
      include: { team: true, _count: { select: { goals: true, cards: true, sanctions: true, participations: true } } },
    }),
    prisma.team.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } }),
  ]);

  return <PlayersManager players={players} teams={teams} />;
}
