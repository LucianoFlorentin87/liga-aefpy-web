"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type FormState } from "@/app/admin/recuperar-contrasena/actions";

const initialState: FormState = {};

export function RequestPasswordResetForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <p className="rounded-lg bg-[var(--color-green-bg)] px-3 py-2 text-sm font-medium text-[var(--color-green-text)]">
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="email">
          Correo de tu cuenta
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-[var(--color-red-100)] px-3 py-2 text-sm font-medium text-[var(--color-red-accent)]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
        {pending ? "Enviando…" : "Enviar enlace de recuperación"}
      </button>
    </form>
  );
}
