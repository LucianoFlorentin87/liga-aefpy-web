import type { ScorerRow } from "@/lib/stats";
import { EmptyState } from "@/components/EmptyState";

export function ScorersTable({ rows, limit }: { rows: ScorerRow[]; limit?: number }) {
  const data = limit ? rows.slice(0, limit) : rows;

  if (data.length === 0) {
    return <EmptyState title="Sin datos registrados" hint="Todavía no hay goles cargados." />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Jugador</th>
            <th>Equipo</th>
            <th className="text-center">Goles</th>
            <th className="text-center">PJ</th>
            <th className="text-center">Promedio</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.playerId}>
              <td className="font-semibold text-[var(--color-gray-500)]">{index + 1}</td>
              <td className="font-semibold text-[var(--color-navy-900)]">{row.playerName}</td>
              <td>{row.teamName}</td>
              <td className="text-center font-bold text-[var(--color-red-600)]">{row.goals}</td>
              <td className="text-center">{row.matchesPlayed}</td>
              <td className="text-center">{row.average.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
