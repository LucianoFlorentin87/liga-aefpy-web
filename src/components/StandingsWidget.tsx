import Link from "next/link";
import type { StandingsRow } from "@/lib/stats";
import { EmptyState } from "@/components/EmptyState";
import { TeamCrest } from "@/components/TeamCrest";

export function StandingsWidget({ rows, limit = 6 }: { rows: StandingsRow[]; limit?: number }) {
  const data = limit ? rows.slice(0, limit) : rows;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-gradient-to-r from-[var(--color-navy-700)] to-[var(--color-navy-950)] px-4 py-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">Tabla de posiciones</h2>
        <Link
          href="/posiciones"
          aria-label="Ver tabla completa"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-navy-900)] shadow hover:bg-[var(--color-gray-100)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="p-5">
          <EmptyState title="Sin datos registrados" hint="Todavía no hay partidos finalizados para calcular la tabla." />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-gray-200)] text-[0.68rem] uppercase tracking-wide text-[var(--color-gray-500)]">
              <th className="py-2 pl-4 text-left font-semibold">Pos</th>
              <th className="py-2 text-left font-semibold">Club</th>
              <th className="py-2 text-center font-semibold">Pts</th>
              <th className="py-2 text-center font-semibold">PJ</th>
              <th className="py-2 pr-4 text-center font-semibold">DG</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.teamId} className="border-b border-[var(--color-gray-100)] last:border-0">
                <td className="py-2 pl-4 font-semibold text-[var(--color-gray-500)]">{index + 1}</td>
                <td className="py-2">
                  <span className="flex items-center gap-2 font-semibold text-[var(--color-navy-900)]">
                    <TeamCrest name={row.teamName} shortName={row.teamShortName} logoUrl={row.logoUrl} size={20} />
                    {row.teamShortName}
                  </span>
                </td>
                <td className="py-2 text-center font-extrabold text-[var(--color-navy-900)]">{row.pts}</td>
                <td className="py-2 text-center text-[var(--color-gray-600)]">{row.pj}</td>
                <td className="py-2 pr-4 text-center text-[var(--color-gray-600)]">
                  {row.dg > 0 ? `+${row.dg}` : row.dg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
