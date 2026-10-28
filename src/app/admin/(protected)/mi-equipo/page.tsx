import Link from "next/link";
import { upcomingScheduleFilter } from "@/lib/matchSchedule";
import { formatDateShort } from "@/lib/format";
import type { Metadata } from "next";
import { prisma, getCurrentSeason } from "@/lib/db";
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
      include: { efhubCard: true, _count: { select: { goals: true, cards: true, sanctions: true, participations: true } } },
    }),
  ]);

  const season = await getCurrentSeason();
  const next = await prisma.match.findFirst({ where: { status: { in: ["PROGRAMADO", "REPROGRAMADO"] }, AND: [{ OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] }, upcomingScheduleFilter()] }, orderBy: [{ date: "asc" }, { time: "asc" }], include: { homeTeam: true, awayTeam: true } });
  return <div className="admin-page-stack"><div className="admin-season-strip"><div><span>{season.name} / Tu plantel</span><h2>{players.filter(player => player.status === "ACTIVO").length} jugadores activos</h2><p className="mt-2 text-xs text-white/70">{next ? "Próximo partido: " + next.homeTeam.shortName + " vs " + next.awayTeam.shortName + " · " + formatDateShort(next.date) + " · " + next.time + " h" : "No hay próximos encuentros programados para tu equipo."}</p></div><Link href={"/equipos/" + team.id}>Ver ficha pública ↗</Link></div><MyTeamManager team={team} players={players} /></div>;
}
