import type { ReactNode } from "react";

/** Estilo de acceso aislado de los campos generales del panel. */
export const GLASS_INPUT_CLASSES =
  "auth-input";

/**
 * Pantalla completa para login (admin y de hinchas): fondo navy con blobs
 * degradé animados (movimiento lento, look orgánico) y una tarjeta de
 * vidrio esmerilado centrada. Las keyframes de los blobs viven en
 * globals.css (.animate-blob) — acá sólo se posicionan y colorean con la
 * paleta de la marca (rojo/navy) en vez del azul genérico de referencia.
 */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="auth-screen relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[var(--color-red-600)] opacity-30 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute top-1/4 -right-32 h-[26rem] w-[26rem] rounded-full bg-[var(--color-red-500)] opacity-20 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[var(--color-navy-700)] opacity-50 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}

/** Tarjeta de vidrio esmerilado usada dentro de AuthScreen. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">{children}</div>
  );
}
