/**
 * Ícono de tarjeta (amarilla/roja) dibujado en SVG — reemplaza los emoji
 * 🟨/🟥 que se usaban antes como header de columna en las tablas de
 * disciplina (DisciplineTable, DisciplineWidget): un emoji se renderiza
 * distinto según SO/navegador y no es parte de ningún sistema de íconos.
 * El amarillo es un color literal (representa el objeto real, no un token
 * de marca que deba invertirse en modo oscuro); el rojo usa un token semántico independiente de la identidad visual.
 */
export function CardIcon({ color, className = "" }: { color: "yellow" | "red"; className?: string }) {
  return (
    <svg
      width="11"
      height="15"
      viewBox="0 0 11 15"
      aria-hidden="true"
      className={`inline-block shrink-0 align-middle ${color === "yellow" ? "text-[var(--football-card-yellow)]" : "text-[var(--football-card-red)]"} ${className}`}
    >
      <rect x="0.75" y="0.75" width="9.5" height="13.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}
