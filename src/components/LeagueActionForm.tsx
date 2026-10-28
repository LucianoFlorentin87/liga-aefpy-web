"use client";
import { useActionState, useId } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LeagueActionState } from "@/lib/league-action-state";

export function LeagueActionForm({ action, children, buttonLabel, danger = false, preview = false }: {
  action: (state: LeagueActionState, form: FormData) => Promise<LeagueActionState>;
  children: ReactNode; buttonLabel: string; danger?: boolean; preview?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const messageId = useId();
  return <form action={preview ? undefined : submit} onSubmit={preview ? event => event.preventDefault() : undefined} className="league-action-form" aria-describedby={state.error || state.success ? messageId : undefined}>
    <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">{children}</fieldset>
    {state.error && <p id={messageId} role="alert" className="field-error mt-4">{state.error}</p>}
    {state.success && <div id={messageId} role="status" className="league-success mt-4"><p>{state.success}</p>{state.link && <Link className="underline underline-offset-4" href={state.link}>{state.linkLabel || "Ver detalle"}</Link>}</div>}
    <button type={preview ? "button" : "submit"} disabled={pending || preview} className={"btn mt-5 " + (danger ? "btn-danger" : "btn-primary")}>{preview ? "Vista previa · envío deshabilitado" : pending ? "Procesando…" : buttonLabel}</button>
  </form>;
}
