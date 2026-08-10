import type { Match, Team } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

type MatchWithTeams = Match & { homeTeam: Team; awayTeam: Team };

export function FixtureList({ matches }: { matches: MatchWithTeams[] }) {
  if (matches.length === 0) {
    return <EmptyState title="Sin datos registrados" hint="Todavía no hay partidos cargados en el fixture." />;
  }

  const byMatchday = new Map<number, MatchWithTeams[]>();
  for (const match of matches) {
    if (!byMatchday.has(match.matchday)) byMatchday.set(match.matchday, []);
    byMatchday.get(match.matchday)!.push(match);
  }
  const matchdays = Array.from(byMatchday.keys()).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6">
      {matchdays.map((matchday) => {
        const games = byMatchday.get(matchday)!;
        return (
          <div key={matchday} className="card overflow-hidden">
            <div className="border-b border-[var(--color-gray-200)] bg-[var(--color-navy-900)] px-4 py-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Jornada {matchday}</h3>
            </div>
            <ul className="divide-y divide-[var(--color-gray-100)]">
              {games.map((match) => (
                <li key={match.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-sm font-semibold text-[var(--color-navy-900)]">{match.time}</span>
                    <span className="text-sm font-medium text-[var(--color-gray-900)]">
                      {match.homeTeam.name} <span className="text-[var(--color-gray-400)]">vs</span> {match.awayTeam.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pl-[3.75rem] text-xs text-[var(--color-gray-500)] sm:pl-0">
                    <span className="capitalize">{formatDate(match.date)}</span>
                    <span>{match.venue}</span>
                    <MatchStatusBadge status={match.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
