import type { Match, MatchGoal, Team } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TeamCrest } from "@/components/TeamCrest";
import { PredictionWidget, type PredictionTally } from "@/components/PredictionWidget";
import { MatchOddsBar } from "@/components/MatchOddsBar";
import type { MatchOdds } from "@/lib/stats";

type MatchWithTeams = Match & { homeTeam: Team; awayTeam: Team; goals: MatchGoal[] };

const VOTABLE_STATUSES = new Set(["PROGRAMADO", "REPROGRAMADO"]);

export function FixtureList({
  matches,
  canVote = false,
  predictionsByMatch = {},
  oddsByMatch = {},
}: {
  matches: MatchWithTeams[];
  canVote?: boolean;
  predictionsByMatch?: Record<string, PredictionTally>;
  oddsByMatch?: Record<string, MatchOdds | null>;
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
            <div className="bg-gradient-to-br from-[var(--color-navy-700)] via-[var(--color-navy-800)] to-[var(--color-navy-950)] px-4 py-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Jornada {matchday}</h3>
            </div>
            <ul className="divide-y divide-[var(--color-gray-100)]">
              {games.map((match) => {
                const isFinished = match.status === "FINALIZADO";
                const homeGoals = match.goals.filter((g) => g.teamId === match.homeTeamId).length;
                const awayGoals = match.goals.filter((g) => g.teamId === match.awayTeamId).length;

                return (
                  <li key={match.id} className="flex flex-col gap-3 px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="w-10 shrink-0 text-sm font-semibold text-[var(--color-navy-900)] sm:w-12">
                          {match.time}
                        </span>
                        <span className="flex w-20 items-center justify-end gap-1.5 truncate text-right text-sm font-semibold text-[var(--color-navy-900)] sm:w-32 md:w-40">
                          <span className="truncate">
                            <span className="hidden sm:inline">{match.homeTeam.name}</span>
                            <span className="sm:hidden">{match.homeTeam.shortName}</span>
                          </span>
                          <TeamCrest
                            name={match.homeTeam.name}
                            shortName={match.homeTeam.shortName}
                            logoUrl={match.homeTeam.logoUrl}
                            size={22}
                          />
                        </span>
                        {isFinished ? (
                          <span className="shrink-0 rounded-md bg-[var(--color-gray-100)] px-2.5 py-1 text-sm font-extrabold text-[var(--color-navy-900)]">
                            {homeGoals} - {awayGoals}
                          </span>
                        ) : (
                          <span className="shrink-0 px-1 text-xs font-semibold text-[var(--color-gray-400)]">vs</span>
                        )}
                        <span className="flex w-20 items-center gap-1.5 truncate text-sm font-semibold text-[var(--color-navy-900)] sm:w-32 md:w-40">
                          <TeamCrest
                            name={match.awayTeam.name}
                            shortName={match.awayTeam.shortName}
                            logoUrl={match.awayTeam.logoUrl}
                            size={22}
                          />
                          <span className="truncate">
                            <span className="hidden sm:inline">{match.awayTeam.name}</span>
                            <span className="sm:hidden">{match.awayTeam.shortName}</span>
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 sm:pl-[3.75rem] text-xs text-[var(--color-gray-500)] lg:pl-0">
                        <span className="capitalize">{formatDate(match.date)}</span>
                        <span>{match.venue}</span>
                        <MatchStatusBadge status={match.status} />
                      </div>
                    </div>
                    {VOTABLE_STATUSES.has(match.status) && (
                      <div className="flex flex-col gap-3 pl-12 sm:pl-[3.75rem]">
                        <MatchOddsBar odds={oddsByMatch[match.id] ?? null} />
                        <PredictionWidget
                          matchId={match.id}
                          canVote={canVote}
                          tally={
                            predictionsByMatch[match.id] ?? {
                              counts: { LOCAL: 0, EMPATE: 0, VISITANTE: 0 },
                              ownChoice: null,
                            }
                          }
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
