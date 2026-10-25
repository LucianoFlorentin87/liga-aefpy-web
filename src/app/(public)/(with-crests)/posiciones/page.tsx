import type { Metadata } from "next";
import { computeStandingsWithTrend } from "@/lib/stats";
import { PageHeader } from "@/components/PageHeader";
import { StandingsTable } from "@/components/StandingsTable";
import { TeamCrest } from "@/components/TeamCrest";

export const metadata: Metadata = { title: "Posiciones" };
export const dynamic = "force-dynamic";

export default async function PosicionesPage() {
  const standings = await computeStandingsWithTrend();
  const leader = standings[0];

  return (
    <div>
      <PageHeader
        title="Tabla de posiciones"
        subtitle="PG = 3 puntos · PE = 1 punto · PP = 0 puntos. Se ordena por puntos, diferencia de gol y goles a favor."
      />
      <div className="container-page py-8">
        {leader && (
          <div className="animate-rise mb-6 flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-surface)] p-5">
            <span className="stat-figure shrink-0 text-7xl text-[var(--color-navy-900)]">#1</span>
            <TeamCrest name={leader.teamName} shortName={leader.teamShortName} logoUrl={leader.logoUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--color-navy-900)]">{leader.teamName}</p>
              <p className="text-xs text-[var(--color-gray-500)]">
                Puntero con <span className="font-bold text-[var(--color-navy-900)]">{leader.pts} pts</span> en {leader.pj} partidos
              </p>
            </div>
          </div>
        )}
        <div className="card p-3 sm:p-5">
          <StandingsTable rows={standings} />
        </div>
      </div>
    </div>
  );
}
