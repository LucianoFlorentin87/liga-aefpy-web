"use client";

import { useActionState } from "react";
import { updateRulesAction, removeRulesPdfAction, type FormState } from "@/app/admin/(protected)/reglamento/actions";

const emptyState: FormState = {};

export function RulesEditor({
  initialContent,
  rulesPdfUrl,
}: {
  initialContent: string;
  rulesPdfUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateRulesAction, emptyState);

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5">
        <h2 className="section-title mb-1">PDF del reglamento</h2>
        <p className="mb-3 text-sm text-[var(--color-gray-500)]">
          Si subís un PDF, se muestra directamente en un visor en la sección pública de Reglamento (tiene
          prioridad sobre el texto de abajo).
        </p>

        {rulesPdfUrl ? (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-[var(--color-gray-50)] px-3 py-2 text-sm">
            <a href={rulesPdfUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-red-600)] hover:underline">
              Ver PDF actual ↗
            </a>
            <form action={removeRulesPdfAction}>
              <button type="submit" className="btn btn-danger !px-2 !py-1 text-xs">
                Quitar PDF
              </button>
            </form>
          </div>
        ) : (
          <p className="mb-3 text-sm text-[var(--color-gray-400)]">Todavía no se subió ningún PDF.</p>
        )}

        <form action={formAction} className="flex flex-col gap-3">
          <div>
            <label className="field-label">Subir / reemplazar PDF (máx. 15MB)</label>
            <input name="rulesPdf" type="file" accept="application/pdf" className="input" />
          </div>

          <div>
            <label className="field-label">
              Contenido en texto (opcional — se usa como respaldo si no hay PDF, separá los párrafos con
              una línea en blanco)
            </label>
            <textarea name="rulesContent" rows={14} defaultValue={initialContent} className="input font-mono text-sm" />
          </div>

          {state.error && <p className="field-error">{state.error}</p>}
          {state.success && <p className="text-sm font-medium text-[#197a44]">{state.success}</p>}

          <button type="submit" disabled={pending} className="btn btn-primary w-fit">
            {pending ? "Guardando…" : "Guardar reglamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
