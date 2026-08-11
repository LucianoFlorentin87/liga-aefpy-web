"use client";

import { useActionState } from "react";
import { loginFanAction, type FanFormState } from "@/app/(public)/cuenta/actions";

const emptyState: FanFormState = {};

export function FanLoginForm() {
  const [state, formAction, pending] = useActionState(loginFanAction, emptyState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="email">
          Correo
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-[var(--color-red-100)] px-3 py-2 text-sm font-medium text-[var(--color-red-700)]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
