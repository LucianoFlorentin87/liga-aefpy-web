"use client";

import { useActionState, useEffect, useState } from "react";
import type { SanctionStatus } from "@prisma/client";
import { formatDateShort, playerFullName } from "@/lib/format";
import { Modal } from "@/components/admin/Modal";
import { SanctionStatusBadge } from "@/components/StatusBadge";
import { createSanctionAction, updateSanctionAction, deleteSanctionAction, type FormState } from "@/app/admin/(protected)/sanciones/actions";

type SanctionRow = {
  id: string;
  reason: string;
  matchesCount: number;
  startDate: Date;
  endDate: Date | null;
  status: SanctionStatus;
  playerId: string;
  player: { firstName: string; lastName: string | null };
  team: { name: string };
};

type PlayerOption = { id: string; firstName: string; lastName: string | null; team: { name: string } };

const emptyState: FormState = {};

function toInputDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function SanctionForm({
  mode,
  sanction,
  players,
  onDone,
}: {
  mode: "create" | "edit";
  sanction?: SanctionRow;
  players: PlayerOption[];
  onDone: () => void;
}) {
  const action = mode === "create" ? createSanctionAction : updateSanctionAction;
  const [state, formAction, pending] = useActionState(action, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mode === "edit" && <input type="hidden" name="id" value={sanction!.id} />}
      <div className="lg:col-span-1">
        <label className="field-label">Jugador</label>
        <select name="playerId" required defaultValue={sanction?.playerId} className="input">
          <option value="" disabled>
            Seleccionar…
          </option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {playerFullName(p)} ({p.team.name})
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="field-label">Motivo</label>
        <input name="reason" required defaultValue={sanction?.reason} className="input" />
      </div>
      <div>
        <label className="field-label">Cantidad de partidos</label>
        <input name="matchesCount" type="number" min={1} required defaultValue={sanction?.matchesCount ?? 1} className="input" />
      </div>
      <div>
        <label className="field-label">Fecha inicio</label>
        <input name="startDate" type="date" required defaultValue={toInputDate(sanction?.startDate ?? null)} className="input" />
      </div>
      <div>
        <label className="field-label">Fecha fin (opcional)</label>
        <input name="endDate" type="date" defaultValue={toInputDate(sanction?.endDate ?? null)} className="input" />
      </div>
      <div>
        <label className="field-label">Estado</label>
        <select name="status" required defaultValue={sanction?.status ?? "ACTIVA"} className="input">
          <option value="ACTIVA">Activa</option>
          <option value="CUMPLIDA">Cumplida</option>
        </select>
      </div>

      {state.error && <p className="field-error sm:col-span-2 lg:col-span-3">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : mode === "create" ? "Registrar sanción" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function SanctionsManager({ sanctions, players }: { sanctions: SanctionRow[]; players: PlayerOption[] }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit"; sanction?: SanctionRow } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Sanciones</h1>
        <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })} disabled={players.length === 0}>
          + Nueva sanción
        </button>
      </div>

      <Modal open={!!panel} onClose={() => setPanel(null)} title={panel?.mode === "create" ? "Registrar sanción" : "Editar sanción"}>
        {panel && <SanctionForm mode={panel.mode} sanction={panel.sanction} players={players} onDone={() => setPanel(null)} />}
      </Modal>

      <div className="card p-3 sm:p-5">
        {sanctions.length === 0 ? (
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Equipo</th>
                  <th>Motivo</th>
                  <th className="text-center">Partidos</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sanctions.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold text-[var(--color-navy-900)]">{playerFullName(s.player)}</td>
                    <td>{s.team.name}</td>
                    <td>{s.reason}</td>
                    <td className="text-center">{s.matchesCount}</td>
                    <td>
                      {formatDateShort(s.startDate)}
                      {s.endDate ? ` – ${formatDateShort(s.endDate)}` : ""}
                    </td>
                    <td>
                      <SanctionStatusBadge status={s.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", sanction: s })}>
                          Editar
                        </button>
                        <form
                          action={deleteSanctionAction}
                          onSubmit={(e) => {
                            if (!confirm("¿Eliminar esta sanción?")) e.preventDefault();
                          }}
                        >
                          <input type="hidden" name="id" value={s.id} />
                          <button className="btn btn-danger !px-2 !py-1 text-xs">Eliminar</button>
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
  );
}
