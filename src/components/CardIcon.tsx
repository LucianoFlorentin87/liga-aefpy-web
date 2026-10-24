/**
 * Ícono de tarjeta (amarilla/roja) dibujado en SVG — reemplaza los emoji
 * 🟨/🟥 que se usaban antes como header de columna en las tablas de
 * disciplina (DisciplineTable, DisciplineWidget): un emoji se renderiza
 * distinto según SO/navegador y no es parte de ningún sistema de íconos.
 * El amarillo es un color literal (representa el objeto real, no un token
 * de marca que deba invertirse en modo oscuro); el rojo reusa el token de
 * acento para quedar consistente con el resto de la UI.
 */
export function CardIcon({ color, className = "" }: { color: "yellow" | "red"; className?: string }) {
  return (
    <svg
      width="11"
      height="15"
      viewBox="0 0 11 15"
      aria-hidden="true"
      className={`inline-block shrink-0 align-middle ${color === "yellow" ? "text-yellow-500" : "text-[var(--color-red-accent)]"} ${className}`}
    >
      <rect x="0.75" y="0.75" width="9.5" height="13.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}
