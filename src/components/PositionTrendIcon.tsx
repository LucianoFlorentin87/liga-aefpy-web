import type { PositionTrend } from "@/lib/stats";

/**
 * Flecha de tendencia junto al número de posición: verde arriba si subió
 * desde antes de la última jornada jugada, roja abajo si bajó, "=" gris si
 * se mantuvo. Sin ícono (trend null) cuando no hay una posición "antes" real
 * con qué comparar (arrancó la temporada, o el equipo recién se sumó).
 */
export function PositionTrendIcon({ trend }: { trend: PositionTrend }) {
  if (!trend) return null;

  if (trend === "same") {
    return (
      <span aria-label="Mantiene posición" title="Mantiene posición" className="inline-flex text-[var(--color-gray-400)]">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
      className="inline-flex"
      style={{ color: isUp ? "#197a44" : "var(--color-red-600)" }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d={isUp ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
