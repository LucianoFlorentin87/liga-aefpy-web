"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type FormState } from "@/app/admin/recuperar-contrasena/actions";

const initialState: FormState = {};

export function RequestPasswordResetForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <p role="status" className="auth-form-success">
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
        <p role="alert" className="auth-form-error">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
        {pending ? "Enviando…" : "Enviar enlace de recuperación"}
      </button>
    </form>
  );
}
