import type { PositionTrend } from "@/lib/stats";

/**
 * Flecha de tendencia junto al número de posición: chip verde con flecha
 * llena hacia arriba si subió desde la última carga de resultados, chip
 * rojo hacia abajo si bajó, chip gris con "=" si se mantuvo. Se usa un
 * chip de color de fondo (no sólo un ícono fino) para que se note de
 * verdad al lado del número, en vez de perderse. Sin ícono (trend null)
 * cuando no hay una posición "antes" real con qué comparar (arrancó la
 * temporada, o el equipo recién se sumó).
 */
export function PositionTrendIcon({ trend }: { trend: PositionTrend }) {
  if (!trend) return null;

  if (trend === "same") {
    return (
      <span
        aria-label="Mantiene posición"
        title="Mantiene posición"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-200)] text-[var(--color-gray-600)]"
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  const isUp = trend === "up";
  return (
    <span
      aria-label={isUp ? "Sube en la tabla" : "Baja en la tabla"}
      title={isUp ? "Sube en la tabla" : "Baja en la tabla"}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
      style={{ background: isUp ? "#e3f5ea" : "var(--color-red-100)", color: isUp ? "#197a44" : "var(--color-red-700)" }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d={isUp ? "M12 5L19.5 19H4.5Z" : "M12 19L4.5 5H19.5Z"} />
      </svg>
    </span>
  );
}
