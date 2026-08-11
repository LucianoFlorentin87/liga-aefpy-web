"use client";

import { useActionState, useState } from "react";
import {
  createPointAdjustmentAction,
  deletePointAdjustmentAction,
  type FormState,
} from "@/app/admin/(protected)/ajustes-puntos/actions";

type AdjustmentRow = {
  id: string;
  points: number;
  reason: string;
  createdAt: Date;
  team: { name: string };
  match: { homeTeam: { name: string }; awayTeam: { name: string } } | null;
};

type TeamOption = { id: string; name: string };

const REASON_PRESETS = [
  "Abandono de partido (Art. 9)",
  "Spam en WhatsApp — Regla Milán-Cherembo (Art. 11)",
  "Otro",
];

const emptyState: FormState = {};

export function PointAdjustmentsManager({
  adjustments,
  teams,
}: {
  adjustments: AdjustmentRow[];
  teams: TeamOption[];
}) {
  const [state, formAction, pending] = useActionState(createPointAdjustmentAction, emptyState);
  const [showForm, setShowForm] = useState(false);
  const [reasonPreset, setReasonPreset] = useState(REASON_PRESETS[0]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Ajustes de puntos</h1>
          <p className="text-sm text-[var(--color-gray-500)]">
            Suma o resta puntos manualmente en la tabla de posiciones (abandono de partido, spam, u otra
            decisión de la organización).
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)} disabled={teams.length === 0}>
          + Nuevo ajuste
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Registrar ajuste</h2>
          <form
            action={formAction}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={() => setShowForm(false)}
          >
            <div>
              <label className="field-label">Equipo</label>
              <select name="teamId" required defaultValue="" className="input">
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
              <label className="field-label">Puntos (negativo resta)</label>
              <input name="points" type="number" required defaultValue={-1} className="input" />
            </div>
            <div className="lg:col-span-2">
              <label className="field-label">Motivo</label>
              <select
                value={reasonPreset}
                onChange={(e) => setReasonPreset(e.target.value)}
                className="input mb-2"
              >
                {REASON_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                name="reason"
                required
                defaultValue={reasonPreset === "Otro" ? "" : reasonPreset}
                key={reasonPreset}
                placeholder="Detalle del motivo"
                className="input"
              />
            </div>

            {state.error && <p className="field-error sm:col-span-2 lg:col-span-4">{state.error}</p>}

            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? "Guardando…" : "Registrar ajuste"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-3 sm:p-5">
        {adjustments.length === 0 ? (
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th className="text-center">Puntos</th>
                  <th>Motivo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold text-[var(--color-navy-900)]">{a.team.name}</td>
                    <td className="text-center font-bold" style={{ color: a.points < 0 ? "var(--color-red-600)" : "#197a44" }}>
                      {a.points > 0 ? `+${a.points}` : a.points}
                    </td>
                    <td>{a.reason}</td>
                    <td>{new Intl.DateTimeFormat("es-PY", { dateStyle: "short" }).format(a.createdAt)}</td>
                    <td>
                      <form
                        action={deletePointAdjustmentAction}
                        onSubmit={(e) => {
                          if (!confirm("¿Eliminar este ajuste de puntos?")) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <button className="btn btn-danger !px-2 !py-1 text-xs">Eliminar</button>
                      </form>
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
