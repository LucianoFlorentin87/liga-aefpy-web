"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Red de seguridad para errores inesperados que escapan el try/catch de las
 * server actions (ej. una excepción en una dependencia de terceros al
 * renderizar). Sin este archivo, Next.js muestra su pantalla genérica en
 * inglés ("This page couldn't load") sin forma de volver salvo recargar
 * manualmente. Acá al menos se ve la marca del sitio y un botón que reintenta
 * sin perder la sesión.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-navy-950)] px-6 text-center text-white">
      <h1 className="text-xl font-extrabold">Ocurrió un error inesperado</h1>
      <p className="max-w-md text-sm text-white/70">Algo falló al procesar la página. Probá de nuevo.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn btn-primary">
          Reintentar
        </button>
        <Link href="/" className="btn btn-outline !border-white/30 !text-white">
          Ir al inicio
        </Link>
      </div>
      {error.digest && <p className="mt-2 text-xs text-white/40">Código: {error.digest}</p>}
    </div>
  );
}
