import type { DisciplineRow } from "@/lib/stats";
import { EmptyState } from "@/components/EmptyState";

export function DisciplineTable({ rows, limit }: { rows: DisciplineRow[]; limit?: number }) {
  const data = limit ? rows.slice(0, limit) : rows;

  if (data.length === 0) {
    return <EmptyState title="Sin datos registrados" hint="Todavía no hay tarjetas cargadas." />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Equipo</th>
            <th className="text-center">PJ</th>
            <th className="text-center">🟨</th>
            <th className="text-center">🟥</th>
            <th className="text-center">Sanciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.playerId}>
              <td className="font-semibold text-[var(--color-navy-900)]">{row.playerName}</td>
              <td>{row.teamName}</td>
              <td className="text-center">{row.matchesPlayed}</td>
              <td className="text-center font-semibold">{row.yellowCards}</td>
              <td className="text-center font-semibold text-[var(--color-red-600)]">{row.redCards}</td>
              <td className="text-center">{row.sanctionsCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
