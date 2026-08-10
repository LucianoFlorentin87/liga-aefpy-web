import type { Metadata } from "next";
import { requireAuth } from "@/lib/permissions";
import { computeStandings } from "@/lib/stats";
import { StandingsTable } from "@/components/StandingsTable";

export const metadata: Metadata = { title: "Posiciones" };
export const dynamic = "force-dynamic";

export default async function AdminPosicionesPage() {
  await requireAuth();
  const standings = await computeStandings();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Tabla de posiciones</h1>
      <div className="card p-3 sm:p-5">
        <StandingsTable rows={standings} />
      </div>
    </div>
  );
}
