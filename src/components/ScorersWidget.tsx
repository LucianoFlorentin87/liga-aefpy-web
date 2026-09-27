import type { ScorerRow } from "@/lib/stats";
import { EmptyState } from "@/components/EmptyState";
import { PlayerCardThumb } from "@/components/PlayerCardThumb";
import { WidgetCard } from "@/components/WidgetCard";

/**
 * Versión compacta de ScorersTable para la portada — mismas columnas
 * esenciales que StandingsWidget (Pos/Club/…): sin PJ ni Promedio, para
 * que entre sin cortes en la tarjeta angosta del inicio (ver DisciplineWidget,
 * mismo problema). La tabla completa con todas las columnas sigue en
 * /goleadores vía ScorersTable.
 */
export function ScorersWidget({ rows, limit = 5 }: { rows: ScorerRow[]; limit?: number }) {
  const data = limit ? rows.slice(0, limit) : rows;

  return (
    <WidgetCard title="Máximos goleadores" href="/goleadores" ariaLabel="Ver todos los goleadores" bodyClassName="">
      {data.length === 0 ? (
        <div className="p-5">
          <EmptyState title="Sin datos registrados" hint="Todavía no hay goles cargados." />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-gray-200)] text-[0.68rem] uppercase tracking-wide text-[var(--color-gray-500)]">
              <th className="py-2 pl-4 text-left font-semibold">Pos</th>
              <th className="py-2 text-left font-semibold">Jugador</th>
              <th className="py-2 pr-4 text-center font-semibold">Goles</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.playerId} className="border-b border-[var(--color-gray-100)] last:border-0">
                <td className="py-2 pl-4 font-semibold text-[var(--color-gray-500)]">{index + 1}</td>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <PlayerCardThumb name={row.playerName} cardImageUrl={row.cardImageUrl} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--color-navy-900)]">
                        {row.playerName}
                      </span>
                      <span className="block truncate text-xs text-[var(--color-gray-500)]">{row.teamName}</span>
                    </span>
                  </span>
                </td>
                <td className="py-2 pr-4 text-center font-extrabold text-[var(--color-red-accent)]">{row.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </WidgetCard>
  );
}
