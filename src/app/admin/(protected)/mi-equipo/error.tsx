"use client";

import { useEffect } from "react";

export default function MyTeamError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("No se pudo cargar el panel del delegado", error);
  }, [error]);

  return (
    <section className="card max-w-3xl p-6 space-y-4" role="alert">
      <h1 className="text-xl font-bold">No se pudo cargar Mi equipo</h1>
      <p>Ocurrió un problema al consultar los datos del equipo. Tus datos no se modificaron.</p>
      <p className="text-sm text-[var(--color-gray-500)]">Si continúa el problema, avisá a la organización para revisar el registro del servidor.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>Volver a intentar</button>
    </section>
  );
}
