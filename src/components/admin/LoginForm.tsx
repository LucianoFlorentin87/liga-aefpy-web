"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="identifier">
          Usuario
        </label>
        <input id="identifier" name="identifier" type="text" autoComplete="username" required className="input" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="field-label" htmlFor="password">
            Contraseña
          </label>
          <Link href="/admin/recuperar-contrasena" className="text-xs font-semibold text-[var(--color-red-accent)] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>

      {state.error && (
        <p className="rounded-lg bg-[var(--color-red-100)] px-3 py-2 text-sm font-medium text-[var(--color-red-accent)]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
