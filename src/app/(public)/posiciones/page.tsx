import type { Metadata } from "next";
import { computeStandings } from "@/lib/stats";
import { PageHeader } from "@/components/PageHeader";
import { StandingsTable } from "@/components/StandingsTable";

export const metadata: Metadata = { title: "Posiciones" };
export const dynamic = "force-dynamic";

export default async function PosicionesPage() {
  const standings = await computeStandings();

  return (
    <div>
      <PageHeader
        title="Tabla de posiciones"
        subtitle="PG = 3 puntos · PE = 1 punto · PP = 0 puntos. Se ordena por puntos, diferencia de gol y goles a favor."
      />
      <div className="container-page py-8">
        <div className="card p-3 sm:p-5">
          <StandingsTable rows={standings} />
        </div>
      </div>
    </div>
  );
}
