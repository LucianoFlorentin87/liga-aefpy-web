"use client";

import { useState } from "react";
import { useActionState } from "react";
import { registerFanAction, type FanFormState } from "@/app/(public)/(with-crests)/cuenta/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { FanCard } from "@/components/FanCard";

const emptyState: FanFormState = {};

export function FanRegisterForm() {
  const [state, formAction, pending] = useActionState(registerFanAction, emptyState);
  // Sólo para el carnet en vivo — los inputs siguen sin controlar, el
  // server action lee los mismos name="" de siempre vía FormData.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <FanCard firstName={firstName} lastName={lastName} />
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="firstName">
              Nombre
            </label>
            <input id="firstName" name="firstName" required className="input" onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="lastName">
              Apellido
            </label>
            <input id="lastName" name="lastName" required className="input" onChange={(e) => setLastName(e.target.value)} />
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
          <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} />
        </div>
        <div>
          <label className="field-label" htmlFor="confirmPassword">
            Confirmar contraseña
          </label>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required minLength={8} />
        </div>

        {state.error && (
          <p className="rounded-lg bg-[var(--color-red-100)] px-3 py-2 text-sm font-medium text-[var(--color-red-accent)]">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
