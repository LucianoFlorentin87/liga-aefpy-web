"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchStatus } from "@prisma/client";
import { formatDateShort, getMatchScore, matchStatusLabel } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

type MatchRow = {
  id: string;
  matchday: number;
  date: Date;
  status: MatchStatus;
  forfeitedTeamId: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  goals: { teamId: string }[];
};

const STATUSES: MatchStatus[] = ["PROGRAMADO", "EN_CURSO", "FINALIZADO", "SUSPENDIDO", "REPROGRAMADO"];

export function ResultsManager({ matches }: { matches: MatchRow[] }) {
  const [search, setSearch] = useState("");
  const [jornadaFilter, setJornadaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "">("");

  const jornadas = Array.from(new Set(matches.map((m) => m.matchday))).sort((a, b) => b - a);

  const filteredMatches = matches.filter((m) => {
    if (jornadaFilter && String(m.matchday) !== jornadaFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!m.homeTeam.name.toLowerCase().includes(q) && !m.awayTeam.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasFilters = search.trim() !== "" || jornadaFilter !== "" || statusFilter !== "";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Resultados</h1>
        <p className="text-sm text-[var(--color-gray-500)]">
          Elegí un partido para cargar goles, tarjetas y el resultado final.
        </p>
      </div>

      {matches.length > 0 && (
        <div className="card flex flex-wrap items-end gap-3 p-3 sm:p-4">
          <div className="min-w-[180px] flex-1">
            <label className="field-label">Buscar equipo</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre del equipo…"
              className="input"
            />
          </div>
          <div>
            <label className="field-label">Jornada</label>
            <select value={jornadaFilter} onChange={(e) => setJornadaFilter(e.target.value)} className="input !w-auto">
              <option value="">Todas</option>
              {jornadas.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MatchStatus | "")}
              className="input !w-auto"
            >
              <option value="">Todos</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {matchStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              type="button"
              className="btn btn-outline !py-2 text-sm"
              onClick={() => {
                setSearch("");
                setJornadaFilter("");
                setStatusFilter("");
              }}
            >
              Limpiar filtros
            </button>
          )}
          <span className="text-sm text-[var(--color-gray-500)]">
            {filteredMatches.length} de {matches.length} partido{matches.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <div className="card p-3 sm:p-5">
        {matches.length === 0 ? (
          <EmptyState title="Sin datos registrados" hint="Todavía no hay partidos programados." />
        ) : filteredMatches.length === 0 ? (
          <p className="empty-state">
            <strong>Ningún partido coincide con los filtros.</strong>
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jornada</th>
                  <th>Fecha</th>
                  <th>Partido</th>
                  <th className="text-center">Resultado</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m) => {
                  const { home: homeGoals, away: awayGoals } = getMatchScore(m);
                  return (
                    <tr key={m.id}>
                      <td>{m.matchday}</td>
                      <td>{formatDateShort(m.date)}</td>
                      <td className="font-semibold text-[var(--color-navy-900)]">
                        {m.homeTeam.name} vs {m.awayTeam.name}
                      </td>
                      <td className="text-center font-bold">
                        {m.status === "PROGRAMADO" ? "—" : `${homeGoals} - ${awayGoals}`}
                      </td>
                      <td>
                        <MatchStatusBadge status={m.status} />
                        {m.forfeitedTeamId && <span className="badge badge-amber ml-1.5">Por abandono</span>}
                      </td>
                      <td>
                        <Link href={`/admin/partidos/${m.id}`} className="btn btn-primary !px-2.5 !py-1 text-xs">
                          Cargar resultado
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
