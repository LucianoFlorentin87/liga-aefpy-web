"use client";

import { useActionState } from "react";
import { FaRegEnvelope, FaLock, FaArrowRight } from "react-icons/fa6";
import { loginFanAction, type FanFormState } from "@/app/(public)/(with-crests)/cuenta/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { GLASS_INPUT_CLASSES } from "@/components/AuthScreen";

const emptyState: FanFormState = {};

export function FanLoginForm() {
  const [state, formAction, pending] = useActionState(loginFanAction, emptyState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-white/70" htmlFor="email">
          Correo
        </label>
        <div className="relative">
          <FaRegEnvelope className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white/40" />
          <input id="email" name="email" type="email" autoComplete="email" required className={GLASS_INPUT_CLASSES} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-white/70" htmlFor="password">
          Contraseña
        </label>
        <div className="relative">
          <FaLock className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white/40" />
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            className={GLASS_INPUT_CLASSES}
            toggleClassName="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
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
