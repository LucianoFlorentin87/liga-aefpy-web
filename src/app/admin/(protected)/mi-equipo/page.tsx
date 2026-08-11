import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireDelegate } from "@/lib/permissions";
import { MyTeamManager } from "@/components/admin/MyTeamManager";

export const metadata: Metadata = { title: "Mi equipo" };
export const dynamic = "force-dynamic";

export default async function MiEquipoPage() {
  const { teamId } = await requireDelegate();

  const [team, players] = await Promise.all([
    prisma.team.findUniqueOrThrow({ where: { id: teamId } }),
    prisma.player.findMany({
      where: { teamId },
      orderBy: { jerseyNumber: "asc" },
      include: { _count: { select: { goals: true, cards: true, sanctions: true, participations: true } } },
    }),
  ]);

  return <MyTeamManager team={team} players={players} />;
}
