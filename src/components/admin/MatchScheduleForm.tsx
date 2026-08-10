"use client";

import { useActionState } from "react";
import type { MatchStatus } from "@prisma/client";
import { matchStatusLabel } from "@/lib/format";
import { updateMatchAction, type FormState } from "@/app/admin/(protected)/partidos/actions";

const STATUSES: MatchStatus[] = ["PROGRAMADO", "EN_CURSO", "FINALIZADO", "SUSPENDIDO", "REPROGRAMADO"];
const emptyState: FormState = {};

export function MatchScheduleForm({
  match,
  teams,
}: {
  match: {
    id: string;
    matchday: number;
    date: Date;
    time: string;
    venue: string;
    status: MatchStatus;
    notes: string | null;
    homeTeamId: string;
    awayTeamId: string;
  };
  teams: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateMatchAction, emptyState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <input type="hidden" name="id" value={match.id} />
      <div>
        <label className="field-label">Jornada</label>
        <input name="matchday" type="number" min={1} required defaultValue={match.matchday} className="input" />
      </div>
      <div>
        <label className="field-label">Fecha</label>
        <input name="date" type="date" required defaultValue={new Date(match.date).toISOString().slice(0, 10)} className="input" />
      </div>
      <div>
        <label className="field-label">Hora</label>
        <input name="time" type="time" required defaultValue={match.time} className="input" />
      </div>
      <div>
        <label className="field-label">Cancha</label>
        <input name="venue" required defaultValue={match.venue} className="input" />
      </div>
      <div>
        <label className="field-label">Equipo local</label>
        <select name="homeTeamId" required defaultValue={match.homeTeamId} className="input">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Equipo visitante</label>
        <select name="awayTeamId" required defaultValue={match.awayTeamId} className="input">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Estado</label>
        <select name="status" required defaultValue={match.status} className="input">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {matchStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="field-label">Observaciones (opcional)</label>
        <textarea name="notes" rows={2} defaultValue={match.notes ?? ""} className="input" />
      </div>

      {state.error && <p className="field-error sm:col-span-2 lg:col-span-3">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-[#197a44] sm:col-span-2 lg:col-span-3">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn btn-navy sm:col-span-2 lg:col-span-3">
        {pending ? "Guardando…" : "Guardar datos del partido"}
      </button>
    </form>
  );
}
