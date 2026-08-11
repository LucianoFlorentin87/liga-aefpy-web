"use client";

import { useActionState, useEffect, useState } from "react";
import { generateFixtureAction, type FormState } from "@/app/admin/(protected)/partidos/generate-fixture-action";

const emptyState: FormState = {};

function computePreview(teamCount: number) {
  if (teamCount < 2) return null;
  const n = teamCount % 2 === 0 ? teamCount : teamCount + 1;
  const rounds = (n - 1) * 2;
  const matches = teamCount * (teamCount - 1);
  return { rounds, matches };
}

export function GenerateFixtureForm({ teamCount, onDone }: { teamCount: number; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(generateFixtureAction, emptyState);
  const [startDate, setStartDate] = useState("");
  const preview = computePreview(teamCount);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      onSubmit={(e) => {
        const msg = preview
          ? `Se van a crear ${preview.matches} partidos en ${preview.rounds} jornadas (una por semana, todos contra todos ida y vuelta). ¿Confirmás?`
          : "¿Confirmás generar el fixture?";
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      <div>
        <label className="field-label">Fecha de inicio (jornada 1)</label>
        <input
          name="startDate"
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="field-label">Hora sugerida</label>
        <input name="matchTime" type="time" required defaultValue="20:00" className="input" />
        <p className="mt-1 text-[0.7rem] text-[var(--color-gray-500)]">
          Orientativa: cada jornada tiene 4 días para jugarse (Art. 6 del reglamento).
        </p>
      </div>
      <div>
        <label className="field-label">Cancha / modalidad</label>
        <input name="venue" required defaultValue="Online" className="input" />
      </div>

      {preview && (
        <p className="text-sm text-[var(--color-gray-600)] sm:col-span-3">
          Con <strong>{teamCount}</strong> equipos activos se van a crear{" "}
          <strong>{preview.matches} partidos</strong> en <strong>{preview.rounds} jornadas</strong> (ida y
          vuelta, todos contra todos), una jornada nueva cada semana a partir de la fecha elegida.
        </p>
      )}

      {state.error && <p className="field-error sm:col-span-3">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={pending || teamCount < 2} className="btn btn-primary">
          {pending ? "Generando…" : "Confirmar y generar"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
