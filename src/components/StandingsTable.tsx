import type { StandingsRowWithTrend } from "@/lib/stats";
import { EmptyState } from "@/components/EmptyState";
import { TeamCrest } from "@/components/TeamCrest";
import { PositionTrendIcon } from "@/components/PositionTrendIcon";
import { ActiveStatusBadge } from "@/components/StatusBadge";

export function StandingsTable({ rows, limit }: { rows: StandingsRowWithTrend[]; limit?: number }) {
  const data = limit ? rows.slice(0, limit) : rows;

  if (data.length === 0) {
    return <EmptyState title="Sin datos registrados" hint="Todavía no hay partidos finalizados para calcular la tabla." />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Equipo</th>
            <th className="text-center">PJ</th>
            <th className="text-center">PG</th>
            <th className="text-center">PE</th>
            <th className="text-center">PP</th>
            <th className="text-center">GF</th>
            <th className="text-center">GC</th>
            <th className="text-center">DG</th>
            <th className="text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.teamId}>
              <td className="font-semibold text-[var(--color-gray-500)]">
                <span className="flex items-center gap-1.5">
                  {index + 1}
                  <PositionTrendIcon trend={row.trend} />
                </span>
              </td>
              <td className="font-semibold text-[var(--color-navy-900)]">
                <span className="flex min-w-0 items-center gap-2">
                  <TeamCrest name={row.teamName} shortName={row.teamShortName} logoUrl={row.logoUrl} size={20} />
                  <span className="truncate">{row.teamName}</span>
                  {row.teamStatus === "RETIRADO" && (
                    <span className="shrink-0">
                      <ActiveStatusBadge status="RETIRADO" />
                    </span>
                  )}
                </span>
              </td>
              <td className="text-center">{row.pj}</td>
              <td className="text-center">{row.pg}</td>
              <td className="text-center">{row.pe}</td>
              <td className="text-center">{row.pp}</td>
              <td className="text-center">{row.gf}</td>
              <td className="text-center">{row.gc}</td>
              <td className="text-center">{row.dg > 0 ? `+${row.dg}` : row.dg}</td>
              <td className="text-center font-bold text-[var(--color-navy-900)]">{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
