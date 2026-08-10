import Link from "next/link";
import type { Match, MatchGoal, Team } from "@prisma/client";
import { formatDateShort } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

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
            <Link
              href={`/resultados/${match.id}`}
              className="flex flex-col gap-2 px-1 py-3.5 hover:bg-[var(--color-gray-50)] sm:flex-row sm:items-center sm:justify-between sm:px-2"
            >
              <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
                <span className="w-32 truncate text-right text-sm font-semibold text-[var(--color-navy-900)] sm:w-40">
                  {match.homeTeam.name}
                </span>
                <span className="rounded-md bg-[var(--color-gray-100)] px-2.5 py-1 text-sm font-extrabold text-[var(--color-navy-900)]">
                  {homeGoals} - {awayGoals}
                </span>
                <span className="w-32 truncate text-sm font-semibold text-[var(--color-navy-900)] sm:w-40">
                  {match.awayTeam.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--color-gray-500)]">
                <span>Jornada {match.matchday}</span>
                <span>{formatDateShort(match.date)}</span>
                <span className="hidden sm:inline">{match.venue}</span>
                <MatchStatusBadge status={match.status} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
