"use client";

import { useActionState } from "react";
import Link from "next/link";
import { completePasswordResetAction, type FormState } from "@/app/admin/recuperar-contrasena/actions";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: FormState = {};

export function CompletePasswordResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(completePasswordResetAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-[var(--color-green-bg)] px-3 py-2 text-sm font-medium text-[var(--color-green-text)]">
          {state.success}
        </p>
        <Link href="/admin/login" className="btn btn-primary w-full">
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="field-label" htmlFor="password">
          Nueva contraseña
        </label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </div>
      <div>
        <label className="field-label" htmlFor="confirmPassword">
          Repetí la nueva contraseña
        </label>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
      </div>

      {state.error && (
        <p className="rounded-lg bg-[var(--color-red-100)] px-3 py-2 text-sm font-medium text-[var(--color-red-accent)]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
        {pending ? "Guardando…" : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
