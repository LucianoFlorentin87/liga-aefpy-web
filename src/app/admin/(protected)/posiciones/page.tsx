import type { Metadata } from "next";
import { requireAuth } from "@/lib/permissions";
import { computeStandingsWithTrend } from "@/lib/stats";
import { StandingsTable } from "@/components/StandingsTable";
import { getCurrentSeason } from "@/lib/db";
import { hasCompetitiveStandings } from "@/lib/standings-presentation";

export const metadata: Metadata = { title: "Posiciones" };
export const dynamic = "force-dynamic";

export default async function AdminPosicionesPage() {
  await requireAuth();
  const [standings, season] = await Promise.all([computeStandingsWithTrend(), getCurrentSeason()]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Tabla de posiciones</h1>
      <div className="card p-3 sm:p-5">
        <StandingsTable rows={standings} ranked={hasCompetitiveStandings(standings, season.status)} />
      </div>
    </div>
  );
}
