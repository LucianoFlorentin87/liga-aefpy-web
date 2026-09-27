import type { DisciplineRow } from "@/lib/stats";
import { EmptyState } from "@/components/EmptyState";
import { PlayerCardThumb } from "@/components/PlayerCardThumb";
import { WidgetCard } from "@/components/WidgetCard";

/**
 * Versión compacta de DisciplineTable para la portada — ver ScorersWidget,
 * mismo motivo: menos columnas para que entre sin cortes en la tarjeta
 * angosta del inicio. La tabla completa sigue en /disciplina.
 */
export function DisciplineWidget({ rows, limit = 5 }: { rows: DisciplineRow[]; limit?: number }) {
  const data = limit ? rows.slice(0, limit) : rows;

  return (
    <WidgetCard title="Resumen de disciplina" href="/disciplina" ariaLabel="Ver todo el resumen de disciplina" bodyClassName="">
      {data.length === 0 ? (
        <div className="p-5">
          <EmptyState title="Sin datos registrados" hint="Todavía no hay tarjetas cargadas." />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-gray-200)] text-[0.68rem] uppercase tracking-wide text-[var(--color-gray-500)]">
              <th className="py-2 pl-4 text-left font-semibold">Jugador</th>
              <th className="py-2 text-center font-semibold">🟨🟥</th>
              <th className="py-2 pr-4 text-center font-semibold">Sanción</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.playerId} className="border-b border-[var(--color-gray-100)] last:border-0">
                <td className="py-2 pl-4">
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
                <td className="py-2 text-center text-[var(--color-gray-600)]">
                  {row.yellowCards}/{row.redCards}
                </td>
                <td className="py-2 pr-4 text-center">
                  {row.sanctionsCount === 0 ? (
                    <span className="text-[var(--color-gray-400)]">—</span>
                  ) : (
                    <span className={`badge ${row.hasActiveSanction ? "badge-red" : "badge-green"}`}>
                      {row.hasActiveSanction ? "Sancionado" : "Cumplida"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </WidgetCard>
  );
}
