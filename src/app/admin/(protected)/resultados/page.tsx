import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { formatDateShort } from "@/lib/format";
import { MatchStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Resultados" };
export const dynamic = "force-dynamic";

export default async function AdminResultadosPage() {
  await requirePermission("resultados");

  const matches = await prisma.match.findMany({
    orderBy: [{ date: "desc" }, { time: "desc" }],
    include: { homeTeam: true, awayTeam: true, goals: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Resultados</h1>
        <p className="text-sm text-[var(--color-gray-500)]">
          Elegí un partido para cargar goles, tarjetas y el resultado final.
        </p>
      </div>

      <div className="card p-3 sm:p-5">
        {matches.length === 0 ? (
          <EmptyState title="Sin datos registrados" hint="Todavía no hay partidos programados." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Jornada</th>
                  <th>Fecha</th>
                  <th>Partido</th>
                  <th className="text-center">Resultado</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const homeGoals = m.goals.filter((g) => g.teamId === m.homeTeamId).length;
                  const awayGoals = m.goals.filter((g) => g.teamId === m.awayTeamId).length;
                  return (
                    <tr key={m.id}>
                      <td>{m.matchday}</td>
                      <td>{formatDateShort(m.date)}</td>
                      <td className="font-semibold text-[var(--color-navy-900)]">
                        {m.homeTeam.name} vs {m.awayTeam.name}
                      </td>
                      <td className="text-center font-bold">
                        {m.status === "PROGRAMADO" ? "—" : `${homeGoals} - ${awayGoals}`}
                      </td>
                      <td>
                        <MatchStatusBadge status={m.status} />
                      </td>
                      <td>
                        <Link href={`/admin/partidos/${m.id}`} className="btn btn-primary !px-2.5 !py-1 text-xs">
                          Cargar resultado
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
