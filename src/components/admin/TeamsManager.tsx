"use client";

import { useActionState, useEffect, useState } from "react";
import type { TeamStatus } from "@prisma/client";
import { ActiveStatusBadge } from "@/components/StatusBadge";
import {
  createTeamAction,
  updateTeamAction,
  toggleTeamStatusAction,
  deleteTeamAction,
  type FormState,
} from "@/app/admin/(protected)/equipos/actions";

type TeamRow = {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  delegateName: string | null;
  delegatePhone: string | null;
  status: TeamStatus;
  _count: { players: number; homeMatches: number; awayMatches: number };
};

const emptyState: FormState = {};

function TeamForm({ mode, team, onDone }: { mode: "create" | "edit"; team?: TeamRow; onDone: () => void }) {
  const action = mode === "create" ? createTeamAction : updateTeamAction;
  const [state, formAction, pending] = useActionState(action, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === "edit" && <input type="hidden" name="id" value={team!.id} />}
      <div>
        <label className="field-label">Nombre</label>
        <input name="name" required defaultValue={team?.name} className="input" />
      </div>
      <div>
        <label className="field-label">Abreviatura</label>
        <input name="shortName" required maxLength={6} defaultValue={team?.shortName} className="input" />
      </div>
      <div>
        <label className="field-label">Delegado</label>
        <input name="delegateName" defaultValue={team?.delegateName ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">Teléfono</label>
        <input name="delegatePhone" defaultValue={team?.delegatePhone ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">Logo (opcional, PNG/JPG/WEBP/SVG, máx. 2MB)</label>
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="input" />
      </div>
      <div>
        <label className="field-label">Estado</label>
        <select name="status" required defaultValue={team?.status ?? "ACTIVO"} className="input">
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      {state.error && <p className="field-error sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : mode === "create" ? "Crear equipo" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function TeamsManager({ teams }: { teams: TeamRow[] }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit"; team?: TeamRow } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Equipos</h1>
        <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })}>
          + Nuevo equipo
        </button>
      </div>

      {panel && (
        <div className="card p-5">
          <h2 className="section-title mb-4">{panel.mode === "create" ? "Crear equipo" : "Editar equipo"}</h2>
          <TeamForm mode={panel.mode} team={panel.team} onDone={() => setPanel(null)} />
        </div>
      )}

      <div className="card p-3 sm:p-5">
        {teams.length === 0 ? (
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Delegado</th>
                  <th>Teléfono</th>
                  <th className="text-center">Jugadores</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => {
                  const hasRelated = t._count.players > 0 || t._count.homeMatches > 0 || t._count.awayMatches > 0;
                  return (
                    <tr key={t.id}>
                      <td className="font-semibold text-[var(--color-navy-900)]">
                        {t.name} <span className="text-[var(--color-gray-400)]">({t.shortName})</span>
                      </td>
                      <td>{t.delegateName || "—"}</td>
                      <td>{t.delegatePhone || "—"}</td>
                      <td className="text-center">{t._count.players}</td>
                      <td>
                        <ActiveStatusBadge status={t.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", team: t })}>
                            Editar
                          </button>
                          <form action={toggleTeamStatusAction}>
                            <input type="hidden" name="id" value={t.id} />
                            <button className="btn btn-ghost !px-2 !py-1 text-xs">
                              {t.status === "ACTIVO" ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                          <form
                            action={deleteTeamAction}
                            onSubmit={(e) => {
                              if (hasRelated) {
                                e.preventDefault();
                                alert("Este equipo tiene jugadores o partidos asociados: desactivalo en vez de eliminarlo.");
                                return;
                              }
                              if (!confirm(`¿Eliminar el equipo ${t.name}?`)) e.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={t.id} />
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
