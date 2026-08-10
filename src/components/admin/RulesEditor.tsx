"use client";

import { useActionState } from "react";
import { updateRulesAction, type FormState } from "@/app/admin/(protected)/reglamento/actions";

const emptyState: FormState = {};

export function RulesEditor({ initialContent }: { initialContent: string }) {
  const [state, formAction, pending] = useActionState(updateRulesAction, emptyState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="field-label">
          Contenido del reglamento (separá los párrafos con una línea en blanco)
        </label>
        <textarea name="rulesContent" rows={18} defaultValue={initialContent} className="input font-mono text-sm" />
      </div>
      {state.error && <p className="field-error">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-[#197a44]">{state.success}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Guardando…" : "Guardar reglamento"}
      </button>
    </form>
  );
}
