import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, playerFullName } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TeamCrest } from "@/components/TeamCrest";

export const dynamic = "force-dynamic";

export default async function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      goals: { include: { player: true }, orderBy: { minute: "asc" } },
      cards: { include: { player: true }, orderBy: { minute: "asc" } },
    },
  });

  if (!match) notFound();

  const homeGoals = match.goals.filter((g) => g.teamId === match.homeTeamId);
  const awayGoals = match.goals.filter((g) => g.teamId === match.awayTeamId);

  return (
    <div>
      <div className="border-b border-[var(--color-gray-200)] bg-[var(--color-navy-900)] text-white">
        <div className="container-page py-8">
          <Link href="/resultados" className="text-xs font-semibold text-white/70 hover:text-white">
            ← Volver a resultados
          </Link>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Jornada {match.matchday}
            </span>
            <MatchStatusBadge status={match.status} />
          </div>
          {/* items-start (no items-center): si el nombre de un equipo pasa a
              dos líneas y el otro no, items-center desalinearía los escudos
              verticalmente — ver NextMatchCard. El marcador se centra en una
              caja de la misma altura que el escudo (h-9 = size 36). */}
          <div className="mt-4 grid grid-cols-3 items-start gap-3 text-center">
            <div className="flex flex-col items-center gap-2">
              <TeamCrest name={match.homeTeam.name} shortName={match.homeTeam.shortName} logoUrl={match.homeTeam.logoUrl} size={36} />
              <span className="text-lg font-extrabold sm:text-2xl">{match.homeTeam.name}</span>
            </div>
            <div className="flex h-9 items-center justify-center text-2xl font-extrabold sm:text-3xl">
              {homeGoals.length} - {awayGoals.length}
            </div>
            <div className="flex flex-col items-center gap-2">
              <TeamCrest name={match.awayTeam.name} shortName={match.awayTeam.shortName} logoUrl={match.awayTeam.logoUrl} size={36} />
              <span className="text-lg font-extrabold sm:text-2xl">{match.awayTeam.name}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-white/70">
            <span className="capitalize">{formatDate(match.date)}</span>
            <span>{match.time} hs</span>
            <span>{match.venue}</span>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-6 py-8 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="section-title mb-3">⚽ Goles</h2>
          {match.goals.length === 0 ? (
            <EmptyState title="Sin datos registrados" hint="Todavía no se cargaron goles para este partido." />
          ) : (
            <ul className="flex flex-col gap-2">
              {match.goals.map((goal) => (
                <li key={goal.id} className="flex items-center justify-between rounded-lg bg-[var(--color-gray-50)] px-3 py-2 text-sm">
                  <span className="font-semibold text-[var(--color-navy-900)]">{playerFullName(goal.player)}</span>
                  <span className="text-[var(--color-gray-500)]">
                    {goal.minute}&apos; · {goal.teamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-3">🟨🟥 Tarjetas</h2>
          {match.cards.length === 0 ? (
            <EmptyState title="Sin datos registrados" hint="Todavía no se cargaron tarjetas para este partido." />
          ) : (
            <ul className="flex flex-col gap-2">
              {match.cards.map((card) => (
                <li key={card.id} className="flex items-center justify-between rounded-lg bg-[var(--color-gray-50)] px-3 py-2 text-sm">
                  <span className="font-semibold text-[var(--color-navy-900)]">
                    {card.type === "AMARILLA" ? "🟨" : "🟥"} {playerFullName(card.player)}
                  </span>
                  <span className="text-[var(--color-gray-500)]">
                    {card.minute}&apos; · {card.teamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="section-title mb-3">Observaciones</h2>
          {match.notes ? (
            <p className="whitespace-pre-wrap text-sm text-[var(--color-gray-700)]">{match.notes}</p>
          ) : (
            <EmptyState title="Sin datos registrados" hint="No hay observaciones para este partido." />
          )}
        </div>
      </div>
    </div>
  );
}
