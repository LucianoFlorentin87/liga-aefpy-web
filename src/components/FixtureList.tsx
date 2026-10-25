"use client";

import { useState } from "react";
import type { Match, MatchGoal, Team } from "@prisma/client";
import { getMatchScore } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TeamCrest } from "@/components/TeamCrest";
import { DateBlock } from "@/components/DateBlock";
import { PredictionWidget, type PredictionTally } from "@/components/PredictionWidget";
import { MatchOddsBar } from "@/components/MatchOddsBar";
import type { MatchOdds } from "@/lib/stats";

type MatchWithTeams = Match & { homeTeam: Team; awayTeam: Team; goals: MatchGoal[] };

const VOTABLE_STATUSES = new Set(["PROGRAMADO", "REPROGRAMADO"]);

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "scheduled", label: "Programados" },
  { key: "finished", label: "Finalizados" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function matchesFilter(status: string, filter: FilterKey) {
  if (filter === "scheduled") return status === "PROGRAMADO" || status === "REPROGRAMADO";
  if (filter === "finished") return status === "FINALIZADO";
  return true;
}

export function FixtureList({
  matches,
  predictionsByMatch = {},
  oddsByMatch = {},
}: {
  matches: MatchWithTeams[];
  predictionsByMatch?: Record<string, PredictionTally>;
  oddsByMatch?: Record<string, MatchOdds | null>;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  if (matches.length === 0) {
    return <EmptyState title="Sin datos registrados" hint="Todavía no hay partidos cargados en el fixture." />;
  }

  const filtered = matches.filter((m) => matchesFilter(m.status, filter));

  const byMatchday = new Map<number, MatchWithTeams[]>();
  for (const match of filtered) {
    if (!byMatchday.has(match.matchday)) byMatchday.set(match.matchday, []);
    byMatchday.get(match.matchday)!.push(match);
  }
  const matchdays = Array.from(byMatchday.keys()).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6">
      {/* Chips de filtro — .btn de base, así en touch (pointer: coarse) ya
          heredan el mínimo de 44px sin declararlo de nuevo acá. */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`btn !rounded-full !px-4 !py-1.5 text-xs ${
              filter === f.key
                ? "!bg-[var(--color-navy-950)] !text-white"
                : "border border-[var(--color-gray-300)] !bg-transparent text-[var(--color-gray-700)] hover:!bg-[var(--color-gray-50)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {matchdays.length === 0 && (
        <EmptyState title="Sin partidos" hint="No hay partidos que coincidan con este filtro." />
      )}

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
                const { home: homeGoals, away: awayGoals } = getMatchScore(match);

                return (
                  <li key={match.id} className="flex gap-3 px-4 py-4">
                    <DateBlock date={match.date} />
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="w-10 shrink-0 text-sm font-semibold text-[var(--color-navy-900)] sm:w-12">
                            {match.time}
                          </span>
                          {/* shortName siempre (no hidden sm:inline / sm:hidden): este
                              componente puede terminar angosto igual que en /resultados
                              — ver la nota de CLAUDE.md sobre breakpoints de viewport. */}
                          <span className="flex w-20 items-center justify-end gap-1.5 text-right text-sm font-semibold text-[var(--color-navy-900)] sm:w-28">
                            <span className="truncate" title={match.homeTeam.name}>
                              {match.homeTeam.shortName}
                            </span>
                            <TeamCrest
                              name={match.homeTeam.name}
                              shortName={match.homeTeam.shortName}
                              logoUrl={match.homeTeam.logoUrl}
                              size={22}
                            />
                          </span>
                          {isFinished ? (
                            <span className="stat-figure shrink-0 rounded-md bg-[var(--color-gray-100)] px-2.5 py-1 text-base text-[var(--color-navy-900)]">
                              {homeGoals} - {awayGoals}
                            </span>
                          ) : (
                            <span className="shrink-0 px-1 text-xs font-semibold text-[var(--color-gray-500)]">vs</span>
                          )}
                          <span className="flex w-20 items-center gap-1.5 text-sm font-semibold text-[var(--color-navy-900)] sm:w-28">
                            <TeamCrest
                              name={match.awayTeam.name}
                              shortName={match.awayTeam.shortName}
                              logoUrl={match.awayTeam.logoUrl}
                              size={22}
                            />
                            <span className="truncate" title={match.awayTeam.name}>
                              {match.awayTeam.shortName}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-gray-500)]">
                          <span>{match.venue}</span>
                          <MatchStatusBadge status={match.status} />
                          {match.forfeitedTeamId && <span className="badge badge-amber">Por abandono</span>}
                        </div>
                      </div>
                      {VOTABLE_STATUSES.has(match.status) && (
                        <div className="flex flex-col gap-3">
                          <MatchOddsBar odds={oddsByMatch[match.id] ?? null} />
                          <PredictionWidget
                            matchId={match.id}
                            tally={
                              predictionsByMatch[match.id] ?? {
                                counts: { LOCAL: 0, EMPATE: 0, VISITANTE: 0 },
                                ownChoice: null,
                              }
                            }
                          />
                        </div>
                      )}
                    </div>
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
