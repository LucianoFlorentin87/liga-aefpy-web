"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type ChangePasswordState } from "@/app/admin/(protected)/cuenta/actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="currentPassword">
          Contraseña actual
        </label>
        <input id="currentPassword" name="currentPassword" type="password" required className="input" />
      </div>
      <div>
        <label className="field-label" htmlFor="newPassword">
          Nueva contraseña
        </label>
        <input id="newPassword" name="newPassword" type="password" required minLength={8} className="input" />
      </div>
      <div>
        <label className="field-label" htmlFor="confirmPassword">
          Confirmar nueva contraseña
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="input" />
      </div>

      {state.error && <p className="field-error">{state.error}</p>}
      {state.success && (
        <p className="rounded-lg bg-[#e3f5ea] px-3 py-2 text-sm font-medium text-[#197a44]">
          Contraseña actualizada correctamente.
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
