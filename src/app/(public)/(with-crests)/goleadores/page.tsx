import type { Metadata } from "next";
import { computeScorers } from "@/lib/stats";
import { PageHeader } from "@/components/PageHeader";
import { ScorersTable } from "@/components/ScorersTable";
import { PlayerCardThumb } from "@/components/PlayerCardThumb";

export const metadata: Metadata = { title: "Goleadores" };
export const dynamic = "force-dynamic";

export default async function GoleadoresPage() {
  const scorers = await computeScorers();
  const top = scorers[0];

  return (
    <div>
      <PageHeader title="Goleadores" subtitle="Calculados automáticamente a partir de los goles registrados en cada partido." />
      <div className="container-page py-8">
        {top && (
          <div className="animate-rise mb-6 flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-surface)] p-5">
            <PlayerCardThumb name={top.playerName} cardImageUrl={top.cardImageUrl} size={136} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--color-navy-900)]">{top.playerName}</p>
              <p className="text-xs text-[var(--color-gray-500)]">{top.teamName}</p>
            </div>
            <span className="stat-figure ml-auto shrink-0 text-7xl text-[var(--color-navy-900)]">{top.goals}</span>
          </div>
        )}
        <div className="card p-3 sm:p-5">
          <ScorersTable rows={scorers} />
        </div>
      </div>
    </div>
  );
}
