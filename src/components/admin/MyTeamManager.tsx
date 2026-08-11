"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import type { Team, PlayerPosition, PlayerStatus } from "@prisma/client";
import { positionLabel } from "@/lib/format";
import { ActiveStatusBadge } from "@/components/StatusBadge";
import {
  updateMyTeamAction,
  createMyPlayerAction,
  updateMyPlayerAction,
  toggleMyPlayerStatusAction,
  type FormState,
} from "@/app/admin/(protected)/mi-equipo/actions";

type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: PlayerPosition;
  status: PlayerStatus;
  birthDate: Date | null;
  _count: { goals: number; cards: number; sanctions: number; participations: number };
};

const POSITIONS: PlayerPosition[] = ["ARQUERO", "DEFENSOR", "MEDIOCAMPISTA", "DELANTERO"];
const emptyState: FormState = {};

function toInputDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function TeamProfileForm({ team }: { team: Team }) {
  const [state, formAction, pending] = useActionState(updateMyTeamAction, emptyState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-center gap-4">
        {team.logoUrl ? (
          <Image src={team.logoUrl} alt={team.name} width={56} height={56} className="rounded-lg object-contain" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-gray-100)] text-xs font-bold text-[var(--color-gray-400)]">
            {team.shortName}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-[var(--color-navy-900)]">{team.name}</p>
          <p className="text-xs text-[var(--color-gray-500)]">El nombre y la abreviatura los administra la liga.</p>
        </div>
      </div>
      <div>
        <label className="field-label">Delegado / contacto</label>
        <input name="delegateName" defaultValue={team.delegateName ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">Teléfono</label>
        <input name="delegatePhone" defaultValue={team.delegatePhone ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">Cancha / estadio</label>
        <input name="homeVenue" defaultValue={team.homeVenue ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">Logo (opcional, PNG/JPG/WEBP/SVG, máx. 2MB)</label>
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="input" />
      </div>

      {state.error && <p className="field-error sm:col-span-2">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-emerald-600 sm:col-span-2">{state.success}</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function PlayerForm({ mode, player, onDone }: { mode: "create" | "edit"; player?: PlayerRow; onDone: () => void }) {
  const action = mode === "create" ? createMyPlayerAction : updateMyPlayerAction;
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
        <label className="field-label">Apellido</label>
        <input name="lastName" required defaultValue={player?.lastName} className="input" />
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
          {pending ? "Guardando…" : mode === "create" ? "Cargar jugador" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function MyTeamManager({ team, players }: { team: Team; players: PlayerRow[] }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit"; player?: PlayerRow } | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Mi equipo</h1>
        <p className="text-sm text-[var(--color-gray-500)]">
          Gestioná el perfil y los jugadores de {team.name}. Los resultados, goles y tarjetas los carga la liga.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">Datos del equipo</h2>
        <TeamProfileForm team={team} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Jugadores</h2>
          <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })}>
            + Nuevo jugador
          </button>
        </div>

        {panel && (
          <div className="card p-5">
            <h3 className="section-title mb-4">{panel.mode === "create" ? "Cargar jugador" : "Editar jugador"}</h3>
            <PlayerForm mode={panel.mode} player={panel.player} onDone={() => setPanel(null)} />
          </div>
        )}

        <div className="card p-3 sm:p-5">
          {players.length === 0 ? (
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
                    <th>Posición</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.id}>
                      <td className="font-bold text-[var(--color-gray-500)]">{p.jerseyNumber}</td>
                      <td className="font-semibold text-[var(--color-navy-900)]">
                        {p.firstName} {p.lastName}
                      </td>
                      <td>{positionLabel(p.position)}</td>
                      <td>
                        <ActiveStatusBadge status={p.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", player: p })}>
                            Editar
                          </button>
                          <form action={toggleMyPlayerStatusAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <button className="btn btn-ghost !px-2 !py-1 text-xs">
                              {p.status === "ACTIVO" ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
