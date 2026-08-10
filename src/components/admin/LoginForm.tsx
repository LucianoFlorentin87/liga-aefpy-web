"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="identifier">
          Usuario o correo
        </label>
        <input id="identifier" name="identifier" type="text" autoComplete="username" required className="input" />
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
