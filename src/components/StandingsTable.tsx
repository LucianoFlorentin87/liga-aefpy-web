import type { StandingsRow } from "@/lib/stats";
import { EmptyState } from "@/components/EmptyState";

export function StandingsTable({ rows, limit }: { rows: StandingsRow[]; limit?: number }) {
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
              <td className="font-semibold text-[var(--color-gray-500)]">{index + 1}</td>
              <td className="font-semibold text-[var(--color-navy-900)]">{row.teamName}</td>
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
