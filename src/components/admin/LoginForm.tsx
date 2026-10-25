"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FaRegUser, FaLock, FaArrowRight } from "react-icons/fa6";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { GLASS_INPUT_CLASSES } from "@/components/AuthScreen";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-white/70" htmlFor="identifier">
          Usuario
        </label>
        <div className="relative">
          <FaRegUser className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            className={GLASS_INPUT_CLASSES}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="mb-1.5 block text-xs font-semibold text-white/70" htmlFor="password">
            Contraseña
          </label>
          <Link href="/admin/recuperar-contrasena" className="text-xs font-semibold text-[var(--color-red-300)] hover:text-white">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <FaLock className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-white/40" />
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            className={`${GLASS_INPUT_CLASSES} !pr-10`}
            toggleClassName="absolute inset-y-0 right-0 flex items-center px-2.5 text-white/40 hover:text-white"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-[var(--color-red-300)]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-red-600)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-red-700)] disabled:opacity-55"
      >
        {pending ? "Ingresando…" : "Ingresar"}
        {!pending && <FaArrowRight className="text-xs" />}
      </button>
    </form>
  );
}
