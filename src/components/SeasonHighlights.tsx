import type { SeasonHighlights as SeasonHighlightsData } from "@/lib/stats";

const ITEMS: { key: keyof SeasonHighlightsData; label: string; format?: (n: number) => string }[] = [
  { key: "matchday", label: "Jornada actual", format: (n) => String(n) },
  { key: "teams", label: "Equipos" },
  { key: "matchesPlayed", label: "Partidos jugados" },
  { key: "goals", label: "Goles en la temporada" },
];

/**
 * Franja de cifras grandes de la temporada — mismo espíritu que las "cifras
 * grandes" de la referencia (número como protagonista), con datos reales del
 * torneo en vez de contenido de ejemplo. @container (no sm:/md:) porque esta
 * franja puede terminar angosta si en algún momento se reusa dentro de una
 * WidgetCard, igual que el resto de los widgets del inicio.
 */
export function SeasonHighlights({ data }: { data: SeasonHighlightsData }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <div
            key={item.key}
            className="animate-rise rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-surface)] px-4 py-5 text-center @lg:text-left"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <p className="stat-figure text-[2.5rem] text-[var(--color-navy-900)] @lg:text-5xl">
              {item.format ? item.format(data[item.key]) : data[item.key]}
            </p>
            <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--color-gray-500)]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
