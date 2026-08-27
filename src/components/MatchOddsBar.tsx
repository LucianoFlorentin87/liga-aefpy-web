import type { MatchOdds } from "@/lib/stats";

/**
 * Muestra el % de favoritismo calculado a partir del rendimiento real de
 * cada equipo en la liga — separado a propósito de PredictionWidget (el
 * voto de los hinchas), con su propio look (barra segmentada) para que no
 * se confundan como el mismo dato.
 */
export function MatchOddsBar({ odds }: { odds: MatchOdds | null }) {
  if (!odds) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[var(--color-gray-400)]">
        Favorito según rendimiento en la liga
      </p>
      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--color-gray-100)]">
        <div style={{ width: `${odds.homeWinPct}%` }} className="bg-[var(--color-navy-700)]" />
        <div style={{ width: `${odds.drawPct}%` }} className="bg-[var(--color-gray-300)]" />
        <div style={{ width: `${odds.awayWinPct}%` }} className="bg-[var(--color-red-500)]" />
      </div>
      <div className="flex justify-between text-[0.68rem] text-[var(--color-gray-500)]">
        <span>Local {odds.homeWinPct}%</span>
        <span>Empate {odds.drawPct}%</span>
        <span>Visitante {odds.awayWinPct}%</span>
      </div>
    </div>
  );
}
