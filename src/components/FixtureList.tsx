import type { Match, Team } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TeamCrest } from "@/components/TeamCrest";
import { PredictionWidget, type PredictionTally } from "@/components/PredictionWidget";

type MatchWithTeams = Match & { homeTeam: Team; awayTeam: Team };

const VOTABLE_STATUSES = new Set(["PROGRAMADO", "REPROGRAMADO"]);

export function FixtureList({
  matches,
  fanLoggedIn = false,
  predictionsByMatch = {},
}: {
  matches: MatchWithTeams[];
  fanLoggedIn?: boolean;
  predictionsByMatch?: Record<string, PredictionTally>;
}) {
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
                    <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-gray-900)]">
                      <TeamCrest name={match.homeTeam.name} shortName={match.homeTeam.shortName} logoUrl={match.homeTeam.logoUrl} />
                      {match.homeTeam.name} <span className="text-[var(--color-gray-400)]">vs</span> {match.awayTeam.name}
                      <TeamCrest name={match.awayTeam.name} shortName={match.awayTeam.shortName} logoUrl={match.awayTeam.logoUrl} />
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pl-[3.75rem] sm:pl-0">
                    <div className="flex items-center gap-3 text-xs text-[var(--color-gray-500)]">
                      <span className="capitalize">{formatDate(match.date)}</span>
                      <span>{match.venue}</span>
                      <MatchStatusBadge status={match.status} />
                    </div>
                    {VOTABLE_STATUSES.has(match.status) && (
                      <PredictionWidget
                        matchId={match.id}
                        fanLoggedIn={fanLoggedIn}
                        tally={
                          predictionsByMatch[match.id] ?? {
                            counts: { LOCAL: 0, EMPATE: 0, VISITANTE: 0 },
                            ownChoice: null,
                          }
                        }
                      />
                    )}
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
