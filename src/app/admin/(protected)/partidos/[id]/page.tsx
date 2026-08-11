import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth, can } from "@/lib/permissions";
import { MatchScheduleForm } from "@/components/admin/MatchScheduleForm";
import { MatchDetailClient } from "@/components/admin/MatchDetailClient";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session } = await requireAuth();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { include: { players: { where: { status: "ACTIVO" }, orderBy: { jerseyNumber: "asc" } } } },
      awayTeam: { include: { players: { where: { status: "ACTIVO" }, orderBy: { jerseyNumber: "asc" } } } },
      goals: { include: { player: true }, orderBy: { minute: "asc" } },
      cards: { include: { player: true }, orderBy: { minute: "asc" } },
      participations: true,
    },
  });

  if (!match) notFound();

  const canEditSchedule = can(session.role, "partidos");
  const canLoadResults = can(session.role, "resultados");
  if (!canEditSchedule && !canLoadResults) notFound();

  const teams = await prisma.team.findMany({ where: { status: "ACTIVO" }, orderBy: { name: "asc" } });

  const activeSanctions = await prisma.sanction.findMany({
    where: {
      status: "ACTIVA",
      playerId: { in: [...match.homeTeam.players, ...match.awayTeam.players].map((p) => p.id) },
    },
    select: { playerId: true },
  });
  const suspendedPlayerIds = new Set(activeSanctions.map((s) => s.playerId));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/partidos" className="text-xs font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-navy-900)]">
          ← Volver a partidos
        </Link>
        <h1 className="mt-1 text-xl font-extrabold text-[var(--color-navy-900)]">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </h1>
        <p className="text-sm text-[var(--color-gray-500)]">Jornada {match.matchday}</p>
      </div>

      {canEditSchedule && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Datos del partido</h2>
          <MatchScheduleForm match={match} teams={teams} />
        </div>
      )}

      <MatchDetailClient
        matchId={match.id}
        status={match.status}
        teams={[
          { id: match.homeTeam.id, name: match.homeTeam.name, players: match.homeTeam.players },
          { id: match.awayTeam.id, name: match.awayTeam.name, players: match.awayTeam.players },
        ]}
        goals={match.goals}
        cards={match.cards}
        participations={match.participations}
        canLoadResults={canLoadResults}
        suspendedPlayerIds={[...suspendedPlayerIds]}
      />
    </div>
  );
}
