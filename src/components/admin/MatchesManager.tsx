"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import type { MatchStatus } from "@prisma/client";
import { matchStatusLabel, formatDateShort } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { createMatchAction, updateMatchAction, deleteMatchAction, type FormState } from "@/app/admin/(protected)/partidos/actions";
import { GenerateFixtureForm } from "@/components/admin/GenerateFixtureForm";

type MatchRow = {
  id: string;
  matchday: number;
  date: Date;
  time: string;
  venue: string;
  status: MatchStatus;
  notes: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  _count: { goals: number; cards: number };
};

type TeamOption = { id: string; name: string };

const STATUSES: MatchStatus[] = ["PROGRAMADO", "EN_CURSO", "FINALIZADO", "SUSPENDIDO", "REPROGRAMADO"];
const emptyState: FormState = {};

function toInputDate(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function MatchForm({
  mode,
  match,
  teams,
  onDone,
}: {
  mode: "create" | "edit";
  match?: MatchRow;
  teams: TeamOption[];
  onDone: () => void;
}) {
  const action = mode === "create" ? createMatchAction : updateMatchAction;
  const [state, formAction, pending] = useActionState(action, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mode === "edit" && <input type="hidden" name="id" value={match!.id} />}
      <div>
        <label className="field-label">Jornada</label>
        <input name="matchday" type="number" min={1} required defaultValue={match?.matchday ?? 1} className="input" />
      </div>
      <div>
        <label className="field-label">Fecha</label>
        <input name="date" type="date" required defaultValue={match ? toInputDate(match.date) : ""} className="input" />
      </div>
      <div>
        <label className="field-label">Hora</label>
        <input name="time" type="time" required defaultValue={match?.time} className="input" />
      </div>
      <div>
        <label className="field-label">Cancha</label>
        <input name="venue" required defaultValue={match?.venue} className="input" />
      </div>
      <div>
        <label className="field-label">Equipo local</label>
        <select name="homeTeamId" required defaultValue={match?.homeTeamId} className="input">
          <option value="" disabled>
            Seleccionar…
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Equipo visitante</label>
        <select name="awayTeamId" required defaultValue={match?.awayTeamId} className="input">
          <option value="" disabled>
            Seleccionar…
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Estado</label>
        <select name="status" required defaultValue={match?.status ?? "PROGRAMADO"} className="input">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {matchStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="field-label">Observaciones (opcional)</label>
        <textarea name="notes" rows={2} defaultValue={match?.notes ?? ""} className="input" />
      </div>

      {state.error && <p className="field-error sm:col-span-2 lg:col-span-3">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : mode === "create" ? "Crear partido" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function MatchesManager({ matches, teams }: { matches: MatchRow[]; teams: TeamOption[] }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit" | "generate"; match?: MatchRow } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Partidos</h1>
        <div className="flex gap-2">
          {matches.length === 0 && (
            <button className="btn btn-navy" onClick={() => setPanel({ mode: "generate" })} disabled={teams.length < 2}>
              Generar fixture automáticamente
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })} disabled={teams.length < 2}>
            + Nuevo partido
          </button>
        </div>
      </div>

      {teams.length < 2 && (
        <p className="rounded-lg bg-[#fdf1d6] px-3 py-2 text-sm font-medium text-[#8a5a05]">
          Necesitás al menos 2 equipos activos para programar un partido.
        </p>
      )}

      {panel?.mode === "generate" && (
        <div className="card p-5">
          <h2 className="section-title mb-1">Generar fixture automáticamente</h2>
          <p className="mb-4 text-sm text-[var(--color-gray-500)]">
            Todos contra todos, ida y vuelta (Art. 1 del reglamento) — una jornada nueva por semana.
          </p>
          <GenerateFixtureForm teamCount={teams.length} onDone={() => setPanel(null)} />
        </div>
      )}

      {(panel?.mode === "create" || panel?.mode === "edit") && (
        <div className="card p-5">
          <h2 className="section-title mb-4">{panel.mode === "create" ? "Crear partido" : "Editar partido"}</h2>
          <MatchForm mode={panel.mode} match={panel.match} teams={teams} onDone={() => setPanel(null)} />
        </div>
      )}

      <div className="card p-3 sm:p-5">
        {matches.length === 0 ? (
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jornada</th>
                  <th>Fecha</th>
                  <th>Partido</th>
                  <th>Cancha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const hasRelated = m._count.goals > 0 || m._count.cards > 0;
                  return (
                    <tr key={m.id}>
                      <td>{m.matchday}</td>
                      <td>{formatDateShort(m.date)}</td>
                      <td className="font-semibold text-[var(--color-navy-900)]">
                        {m.homeTeam.name} vs {m.awayTeam.name}
                      </td>
                      <td>{m.venue}</td>
                      <td>
                        <MatchStatusBadge status={m.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <Link href={`/admin/partidos/${m.id}`} className="btn btn-ghost !px-2 !py-1 text-xs">
                            Ver / cargar resultado
                          </Link>
                          <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", match: m })}>
                            Editar
                          </button>
                          <form
                            action={deleteMatchAction}
                            onSubmit={(e) => {
                              if (hasRelated) {
                                e.preventDefault();
                                alert("Este partido ya tiene goles o tarjetas cargadas: cambiá el estado en vez de eliminarlo.");
                                return;
                              }
                              if (!confirm("¿Eliminar este partido?")) e.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={m.id} />
                            <button className="btn btn-danger !px-2 !py-1 text-xs">Eliminar</button>
                          </form>
                        </div>
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
