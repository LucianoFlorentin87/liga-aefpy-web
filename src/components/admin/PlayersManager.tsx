"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import type { PlayerPosition, PlayerStatus } from "@prisma/client";
import { positionLabel, playerFullName } from "@/lib/format";
import { Modal } from "@/components/admin/Modal";
import { ActiveStatusBadge } from "@/components/StatusBadge";
import {
  createPlayerAction,
  updatePlayerAction,
  togglePlayerStatusAction,
  deletePlayerAction,
  type FormState,
} from "@/app/admin/(protected)/jugadores/actions";

type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  jerseyNumber: number;
  position: PlayerPosition;
  status: PlayerStatus;
  birthDate: Date | null;
  teamId: string;
  team: { id: string; name: string };
  _count: { goals: number; cards: number; sanctions: number; participations: number };
};

type TeamOption = { id: string; name: string };

const POSITIONS: PlayerPosition[] = ["ARQUERO", "DEFENSOR", "MEDIOCAMPISTA", "DELANTERO"];
const emptyState: FormState = {};

function toInputDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function PlayerForm({
  mode,
  player,
  teams,
  onDone,
}: {
  mode: "create" | "edit";
  player?: PlayerRow;
  teams: TeamOption[];
  onDone: () => void;
}) {
  const action = mode === "create" ? createPlayerAction : updatePlayerAction;
  const [state, formAction, pending] = useActionState(action, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === "edit" && <input type="hidden" name="id" value={player!.id} />}
      <div>
        <label className="field-label">Nombre</label>
        <input name="firstName" required defaultValue={player?.firstName} className="input" />
      </div>
      <div>
        <label className="field-label">Apellido (opcional)</label>
        <input name="lastName" defaultValue={player?.lastName ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">Número de camiseta</label>
        <input name="jerseyNumber" type="number" min={0} max={99} required defaultValue={player?.jerseyNumber} className="input" />
      </div>
      <div>
        <label className="field-label">Posición</label>
        <select name="position" required defaultValue={player?.position ?? "DELANTERO"} className="input">
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {positionLabel(p)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Equipo</label>
        <select name="teamId" required defaultValue={player?.teamId} className="input">
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
        <label className="field-label">Fecha de nacimiento (opcional)</label>
        <input name="birthDate" type="date" defaultValue={toInputDate(player?.birthDate ?? null)} className="input" />
      </div>
      <div>
        <label className="field-label">Estado</label>
        <select name="status" required defaultValue={player?.status ?? "ACTIVO"} className="input">
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      {state.error && <p className="field-error sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : mode === "create" ? "Crear jugador" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function PlayersManager({ players, teams }: { players: PlayerRow[]; teams: TeamOption[] }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit"; player?: PlayerRow } | null>(null);
  const [teamFilter, setTeamFilter] = useState("");

  const filtered = teamFilter ? players.filter((p) => p.teamId === teamFilter) : players;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Jugadores</h1>
        <div className="flex items-center gap-2">
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="input !w-auto">
            <option value="">Todos los equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })} disabled={teams.length === 0}>
            + Nuevo jugador
          </button>
        </div>
      </div>

      {teams.length === 0 && (
        <p className="rounded-lg bg-[#fdf1d6] px-3 py-2 text-sm font-medium text-[#8a5a05]">
          Primero cargá al menos un equipo en Torneo → Equipos.
        </p>
      )}

      <Modal open={!!panel} onClose={() => setPanel(null)} title={panel?.mode === "create" ? "Crear jugador" : "Editar jugador"}>
        {panel && <PlayerForm mode={panel.mode} player={panel.player} teams={teams} onDone={() => setPanel(null)} />}
      </Modal>

      <div className="card p-3 sm:p-5">
        {filtered.length === 0 ? (
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Jugador</th>
                  <th>Equipo</th>
                  <th>Posición</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const hasRelated =
                    p._count.goals > 0 || p._count.cards > 0 || p._count.sanctions > 0 || p._count.participations > 0;
                  return (
                    <tr key={p.id}>
                      <td className="font-bold text-[var(--color-gray-500)]">{p.jerseyNumber}</td>
                      <td className="font-semibold text-[var(--color-navy-900)]">{playerFullName(p)}</td>
                      <td>{p.team.name}</td>
                      <td>{positionLabel(p.position)}</td>
                      <td>
                        <ActiveStatusBadge status={p.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <Link href={`/admin/jugadores/${p.id}`} className="btn btn-ghost !px-2 !py-1 text-xs">
                            Estadísticas
                          </Link>
                          <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", player: p })}>
                            Editar
                          </button>
                          <form action={togglePlayerStatusAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <button className="btn btn-ghost !px-2 !py-1 text-xs">
                              {p.status === "ACTIVO" ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                          <form
                            action={deletePlayerAction}
                            onSubmit={(e) => {
                              if (hasRelated) {
                                e.preventDefault();
                                alert("Este jugador tiene goles, tarjetas o sanciones asociadas: desactivalo en vez de eliminarlo.");
                                return;
                              }
                              if (!confirm(`¿Eliminar a ${playerFullName(p)}?`)) e.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={p.id} />
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
