"use client";

import { useActionState, useMemo, useState } from "react";
import type { CardType, MatchStatus, PlayerPosition } from "@prisma/client";
import { matchStatusLabel, playerFullName } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import {
  addGoalAction,
  deleteGoalAction,
  addCardAction,
  deleteCardAction,
  setParticipationAction,
  removeParticipationAction,
  setMatchStatusAction,
  type FormState,
} from "@/app/admin/(protected)/partidos/match-actions";

type PlayerOption = { id: string; firstName: string; lastName: string | null; jerseyNumber: number; position: PlayerPosition };
type TeamInfo = { id: string; name: string; players: PlayerOption[] };

type GoalRow = { id: string; minute: number; teamId: string; player: { id: string; firstName: string; lastName: string | null } };
type CardRow = {
  id: string;
  minute: number;
  teamId: string;
  type: CardType;
  note: string | null;
  player: { id: string; firstName: string; lastName: string | null };
};
type ParticipationRow = { playerId: string; teamId: string; isStarter: boolean };

const STATUSES: MatchStatus[] = ["PROGRAMADO", "EN_CURSO", "FINALIZADO", "SUSPENDIDO", "REPROGRAMADO"];
const emptyState: FormState = {};

function TeamPlayerSelect({
  name,
  teams,
  teamValue,
  onTeamChange,
  playerName,
}: {
  name: string;
  teams: TeamInfo[];
  teamValue: string;
  onTeamChange: (teamId: string) => void;
  playerName: string;
}) {
  const players = teams.find((t) => t.id === teamValue)?.players ?? [];
  return (
    <>
      <div>
        <label className="field-label">Equipo</label>
        <select name={name} required value={teamValue} onChange={(e) => onTeamChange(e.target.value)} className="input">
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
        <label className="field-label">Jugador</label>
        <select name={playerName} required defaultValue="" className="input" disabled={!teamValue}>
          <option value="" disabled>
            {teamValue ? "Seleccionar…" : "Elegí el equipo primero"}
          </option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.jerseyNumber} {playerFullName(p)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function GoalForm({ matchId, teams }: { matchId: string; teams: TeamInfo[] }) {
  const [state, formAction, pending] = useActionState(addGoalAction, emptyState);
  const [teamId, setTeamId] = useState("");

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
      <input type="hidden" name="matchId" value={matchId} />
      <TeamPlayerSelect name="teamId" teams={teams} teamValue={teamId} onTeamChange={setTeamId} playerName="playerId" />
      <div>
        <label className="field-label">Minuto</label>
        <input name="minute" type="number" min={0} max={130} required className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary h-[38px]">
        {pending ? "Guardando…" : "+ Gol"}
      </button>
      {state.error && <p className="field-error col-span-2 sm:col-span-4">{state.error}</p>}
    </form>
  );
}

function CardForm({ matchId, teams }: { matchId: string; teams: TeamInfo[] }) {
  const [state, formAction, pending] = useActionState(addCardAction, emptyState);
  const [teamId, setTeamId] = useState("");

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end">
      <input type="hidden" name="matchId" value={matchId} />
      <TeamPlayerSelect name="teamId" teams={teams} teamValue={teamId} onTeamChange={setTeamId} playerName="playerId" />
      <div>
        <label className="field-label">Tipo</label>
        <select name="type" required defaultValue="AMARILLA" className="input">
          <option value="AMARILLA">Amarilla</option>
          <option value="ROJA">Roja</option>
        </select>
      </div>
      <div>
        <label className="field-label">Minuto</label>
        <input name="minute" type="number" min={0} max={130} required className="input" />
      </div>
      <div>
        <label className="field-label">Observación</label>
        <input name="note" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary h-[38px]">
        {pending ? "Guardando…" : "+ Tarjeta"}
      </button>
      {state.error && <p className="field-error col-span-2 sm:col-span-6">{state.error}</p>}
      {state.success && (
        <p className="col-span-2 text-sm font-medium text-[#197a44] sm:col-span-6">{state.success}</p>
      )}
    </form>
  );
}

export function MatchDetailClient({
  matchId,
  status,
  teams,
  goals,
  cards,
  participations,
  canLoadResults,
  suspendedPlayerIds,
}: {
  matchId: string;
  status: MatchStatus;
  teams: TeamInfo[];
  goals: GoalRow[];
  cards: CardRow[];
  participations: ParticipationRow[];
  canLoadResults: boolean;
  suspendedPlayerIds: string[];
}) {
  const suspendedSet = useMemo(() => new Set(suspendedPlayerIds), [suspendedPlayerIds]);
  const participationByPlayer = useMemo(() => new Map(participations.map((p) => [p.playerId, p])), [participations]);

  if (!canLoadResults) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5">
        <h2 className="section-title mb-3">Estado del partido</h2>
        <form action={setMatchStatusAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="matchId" value={matchId} />
          <div>
            <label className="field-label">Estado</label>
            <select name="status" defaultValue={status} className="input !w-auto">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {matchStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-navy">
            Actualizar estado
          </button>
          <MatchStatusBadge status={status} />
        </form>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">Convocados</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {teams.map((team) => (
            <div key={team.id}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-gray-500)]">{team.name}</p>
              {team.players.length === 0 ? (
                <EmptyState title="Sin datos registrados" hint="Este equipo no tiene jugadores cargados." />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {team.players.map((p) => {
                    const participation = participationByPlayer.get(p.id);
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-gray-50)] px-3 py-1.5 text-sm">
                        <span className="flex items-center gap-2">
                          #{p.jerseyNumber} {playerFullName(p)}
                          {suspendedSet.has(p.id) && (
                            <span className="badge badge-red">Suspendido</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <form action={setParticipationAction} className="flex items-center gap-1.5">
                            <input type="hidden" name="matchId" value={matchId} />
                            <input type="hidden" name="playerId" value={p.id} />
                            <input type="hidden" name="teamId" value={team.id} />
                            <label className="flex items-center gap-1 text-xs text-[var(--color-gray-600)]">
                              <input type="checkbox" name="isStarter" defaultChecked={participation?.isStarter ?? false} />
                              Titular
                            </label>
                            <button type="submit" className="btn btn-ghost !px-2 !py-1 text-xs">
                              {participation ? "Actualizar" : "Convocar"}
                            </button>
                          </form>
                          {participation && (
                            <form action={removeParticipationAction}>
                              <input type="hidden" name="matchId" value={matchId} />
                              <input type="hidden" name="playerId" value={p.id} />
                              <button type="submit" className="btn btn-ghost !px-2 !py-1 text-xs text-[var(--color-red-600)]">
                                Quitar
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">⚽ Goles</h2>
        <GoalForm matchId={matchId} teams={teams} />
        <ul className="mt-4 flex flex-col gap-2">
          {goals.length === 0 && <EmptyState title="Sin datos registrados" hint="Todavía no hay goles cargados." />}
          {goals.map((g) => (
            <li key={g.id} className="flex items-center justify-between rounded-lg bg-[var(--color-gray-50)] px-3 py-2 text-sm">
              <span>
                {g.minute}&apos; · {playerFullName(g.player)}
              </span>
              <form action={deleteGoalAction}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="matchId" value={matchId} />
                <button type="submit" className="btn btn-danger !px-2 !py-1 text-xs">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-3">🟨🟥 Tarjetas</h2>
        <CardForm matchId={matchId} teams={teams} />
        <ul className="mt-4 flex flex-col gap-2">
          {cards.length === 0 && <EmptyState title="Sin datos registrados" hint="Todavía no hay tarjetas cargadas." />}
          {cards.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg bg-[var(--color-gray-50)] px-3 py-2 text-sm">
              <span>
                {c.type === "AMARILLA" ? "🟨" : "🟥"} {c.minute}&apos; · {playerFullName(c.player)}
                {c.note ? ` — ${c.note}` : ""}
              </span>
              <form action={deleteCardAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="matchId" value={matchId} />
                <button type="submit" className="btn btn-danger !px-2 !py-1 text-xs">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
