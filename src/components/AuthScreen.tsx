import type { ReactNode } from "react";

/**
 * Clase compartida para los inputs "línea abajo, sin caja" de las pantallas
 * de login (LoginForm y FanLoginForm) — con ! en cada propiedad que choca
 * con la clase global .input (border/background/radius), porque esta
 * misma especificidad sin ! pierde contra .input (se define después en
 * globals.css): sin el !, el campo de contraseña (que además lleva la
 * clase "input" por PasswordInput) quedaba con un recuadro completo en vez
 * de la línea simple de abajo.
 */
export const GLASS_INPUT_CLASSES =
  "w-full !rounded-none !border-0 !border-b !border-white/25 !bg-transparent px-1 py-2 pl-7 text-sm text-white placeholder:text-white/40 focus:!border-white/70 focus:!outline-none";

/**
 * Pantalla completa para login (admin y de hinchas): fondo navy con blobs
 * degradé animados (movimiento lento, look orgánico) y una tarjeta de
 * vidrio esmerilado centrada. Las keyframes de los blobs viven en
 * globals.css (.animate-blob) — acá sólo se posicionan y colorean con la
 * paleta de la marca (rojo/navy) en vez del azul genérico de referencia.
 */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
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
