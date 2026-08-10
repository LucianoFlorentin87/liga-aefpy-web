import type { Metadata } from "next";
import { computeDiscipline } from "@/lib/stats";
import { PageHeader } from "@/components/PageHeader";
import { DisciplineTable } from "@/components/DisciplineTable";

export const metadata: Metadata = { title: "Disciplina" };
export const dynamic = "force-dynamic";

export default async function DisciplinaPage() {
  const discipline = await computeDiscipline();

  return (
    <div>
      <PageHeader title="Disciplina" subtitle="Tarjetas y sanciones registradas por partido." />
      <div className="container-page py-8">
        <div className="card p-3 sm:p-5">
          <DisciplineTable rows={discipline} />
        </div>
      </div>
    </div>
  );
}
