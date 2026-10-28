"use client";

import { useActionState } from "react";
import { FaRegEnvelope, FaLock, FaArrowRight } from "react-icons/fa6";
import { loginFanAction, type FanFormState } from "@/app/(public)/(with-crests)/cuenta/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { AUTH_INPUT_CLASSES } from "@/components/auth-styles";

const emptyState: FanFormState = {};

export function FanLoginForm() {
  const [state, formAction, pending] = useActionState(loginFanAction, emptyState);

  return (
    <form action={formAction} className="flex flex-col gap-5" aria-busy={pending}>
      <div>
        <label className="auth-field-label" htmlFor="email">
          Correo
        </label>
        <div className="relative">
          <FaRegEnvelope aria-hidden="true" className="auth-field-icon" />
          <input id="email" name="email" type="email" autoComplete="email" required className={AUTH_INPUT_CLASSES} />
        </div>
      </div>
      <div>
        <label className="auth-field-label" htmlFor="password">
          Contraseña
        </label>
        <div className="relative">
          <FaLock aria-hidden="true" className="auth-field-icon" />
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            className={AUTH_INPUT_CLASSES}
            toggleClassName="auth-password-toggle"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="auth-form-error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="auth-submit"
      >
        {pending ? "Ingresando…" : "Ingresar"}
        {!pending && <FaArrowRight aria-hidden="true" className="text-xs" />}
      </button>
    </form>
  );
}
