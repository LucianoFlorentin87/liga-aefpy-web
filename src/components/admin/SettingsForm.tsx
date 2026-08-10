"use client";

import { useActionState, useState } from "react";
import { updateSettingsAction, type FormState } from "@/app/admin/(protected)/configuracion/actions";

const CRITERIA_LABEL: Record<string, string> = {
  PTS: "Puntos",
  DG: "Diferencia de gol",
  GF: "Goles a favor",
  PG: "Partidos ganados",
};
const ALL_CRITERIA = ["PTS", "DG", "GF", "PG"];

const emptyState: FormState = {};

export function SettingsForm({ tournamentName, standingsCriteria }: { tournamentName: string; standingsCriteria: string }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, emptyState);
  const initial = standingsCriteria.split(",").filter(Boolean);
  const [criteria, setCriteria] = useState<[string, string, string]>([
    initial[0] ?? "PTS",
    initial[1] ?? "DG",
    initial[2] ?? "GF",
  ]);

  function update(index: number, value: string) {
    const next = [...criteria] as [string, string, string];
    next[index] = value;
    setCriteria(next);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-lg">
      <div>
        <label className="field-label">Nombre del torneo</label>
        <input name="tournamentName" required defaultValue={tournamentName} className="input" />
      </div>

      <div>
        <p className="field-label mb-2">Criterio de desempate de la tabla de posiciones (en orden)</p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <select key={i} value={criteria[i]} onChange={(e) => update(i, e.target.value)} className="input">
              {ALL_CRITERIA.map((c) => (
                <option key={c} value={c}>
                  {i + 1}º · {CRITERIA_LABEL[c]}
                </option>
              ))}
            </select>
          ))}
        </div>
        <input type="hidden" name="standingsCriteria" value={criteria.join(",")} />
      </div>

      {state.error && <p className="field-error">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-[#197a44]">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
