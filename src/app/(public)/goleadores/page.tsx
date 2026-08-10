import type { Metadata } from "next";
import { computeScorers } from "@/lib/stats";
import { PageHeader } from "@/components/PageHeader";
import { ScorersTable } from "@/components/ScorersTable";

export const metadata: Metadata = { title: "Goleadores" };
export const dynamic = "force-dynamic";

export default async function GoleadoresPage() {
  const scorers = await computeScorers();

  return (
    <div>
      <PageHeader title="Goleadores" subtitle="Calculados automáticamente a partir de los goles registrados en cada partido." />
      <div className="container-page py-8">
        <div className="card p-3 sm:p-5">
          <ScorersTable rows={scorers} />
        </div>
      </div>
    </div>
  );
}
