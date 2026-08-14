import Link from "next/link";
import type { Match, MatchGoal, Team } from "@prisma/client";
import { formatDateShort } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TeamCrest } from "@/components/TeamCrest";

type MatchWithData = Match & { homeTeam: Team; awayTeam: Team; goals: MatchGoal[] };

export function ResultsList({ matches }: { matches: MatchWithData[] }) {
  if (matches.length === 0) {
    return <EmptyState title="Sin datos registrados" hint="Todavía no hay resultados cargados." />;
  }

  return (
    <ul className="divide-y divide-[var(--color-gray-100)]">
      {matches.map((match) => {
        const homeGoals = match.goals.filter((g) => g.teamId === match.homeTeamId).length;
        const awayGoals = match.goals.filter((g) => g.teamId === match.awayTeamId).length;
        return (
          <li key={match.id}>
            {/* Siempre en columna: el bloque de meta info nunca compite por ancho con los
                nombres de equipo, sin importar si este componente se renderiza en la página
                completa de /resultados o en una tarjeta más angosta del inicio. */}
            <Link href={`/resultados/${match.id}`} className="flex flex-col gap-2.5 px-1 py-4 hover:bg-[var(--color-gray-50)] sm:px-2">
              <div className="flex items-center gap-3">
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right text-sm font-semibold text-[var(--color-navy-900)]">
                  <TeamCrest name={match.homeTeam.name} shortName={match.homeTeam.shortName} logoUrl={match.homeTeam.logoUrl} size={20} />
                  <span className="truncate">{match.homeTeam.name}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-md bg-[var(--color-gray-100)] px-2.5 py-1 text-sm font-extrabold text-[var(--color-navy-900)]">
                  {homeGoals} - {awayGoals}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-[var(--color-navy-900)]">
                  <TeamCrest name={match.awayTeam.name} shortName={match.awayTeam.shortName} logoUrl={match.awayTeam.logoUrl} size={20} />
                  <span className="truncate">{match.awayTeam.name}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[var(--color-gray-500)]">
                <span className="shrink-0 whitespace-nowrap">Jornada {match.matchday}</span>
                <span className="shrink-0 whitespace-nowrap">{formatDateShort(match.date)}</span>
                <span className="hidden shrink-0 whitespace-nowrap sm:inline">{match.venue}</span>
                <span className="shrink-0">
                  <MatchStatusBadge status={match.status} />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
