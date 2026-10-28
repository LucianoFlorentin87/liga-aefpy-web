"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FaRegUser, FaLock, FaArrowRight } from "react-icons/fa6";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { AUTH_INPUT_CLASSES } from "@/components/auth-styles";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" aria-busy={pending}>
      <div>
        <label className="auth-field-label" htmlFor="identifier">
          Usuario
        </label>
        <div className="relative">
          <FaRegUser aria-hidden="true" className="auth-field-icon" />
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username" autoCapitalize="none" spellCheck={false}
            required
            className={AUTH_INPUT_CLASSES}
          />
        </div>
      </div>
      <div>
        <div className="auth-field-heading">
          <label className="auth-field-label" htmlFor="password">
            Contraseña
          </label>
          <Link href="/admin/recuperar-contrasena" className="auth-recovery-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
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
