"use client";

import { useEffect, useState } from "react";

/**
 * Botón de modo claro/oscuro. Lee el tema ya aplicado por el script inline
 * de layout.tsx (o el de sistema, si el usuario nunca lo tocó) recién al
 * montar — así el primer render del cliente coincide con lo que el usuario
 * ya está viendo y no hay parpadeo. Al tocarlo, guarda una preferencia
 * explícita que a partir de ahí gana siempre sobre el tema del sistema.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  // Evita renderizar un ícono que podría no coincidir con el tema real
  // hasta que el efecto de arriba confirme cuál es (SSR no sabe la
  // preferencia del usuario).
  if (isDark === null) {
    return <span className={`inline-block h-9 w-9 ${className}`} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${className}`}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
