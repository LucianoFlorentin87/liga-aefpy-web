import type { Metadata } from "next";
import { requireAuth } from "@/lib/permissions";
import { computeScorers } from "@/lib/stats";
import { ScorersTable } from "@/components/ScorersTable";

export const metadata: Metadata = { title: "Goleadores" };
export const dynamic = "force-dynamic";

export default async function AdminGoleadoresPage() {
  await requireAuth();
  const scorers = await computeScorers();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Goleadores</h1>
      <div className="card p-3 sm:p-5">
        <ScorersTable rows={scorers} />
      </div>
    </div>
  );
}
