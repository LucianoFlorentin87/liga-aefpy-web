"use client";

import { useActionState } from "react";
import { registerFanAction, type FanFormState } from "@/app/(public)/cuenta/actions";

const emptyState: FanFormState = {};

export function FanRegisterForm() {
  const [state, formAction, pending] = useActionState(registerFanAction, emptyState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="firstName">
            Nombre
          </label>
          <input id="firstName" name="firstName" required className="input" />
        </div>
        <div>
          <label className="field-label" htmlFor="lastName">
            Apellido
          </label>
          <input id="lastName" name="lastName" required className="input" />
        </div>
      </div>
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
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </div>
      <div>
        <label className="field-label" htmlFor="confirmPassword">
          Confirmar contraseña
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-[var(--color-red-100)] px-3 py-2 text-sm font-medium text-[var(--color-red-700)]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
