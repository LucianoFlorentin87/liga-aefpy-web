import type { Metadata } from "next";
import { requireAuth } from "@/lib/permissions";
import { computeDiscipline } from "@/lib/stats";
import { DisciplineTable } from "@/components/DisciplineTable";

export const metadata: Metadata = { title: "Disciplina" };
export const dynamic = "force-dynamic";

export default async function AdminDisciplinaPage() {
  await requireAuth();
  const discipline = await computeDiscipline();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Disciplina</h1>
      <div className="card p-3 sm:p-5">
        <DisciplineTable rows={discipline} />
      </div>
    </div>
  );
}
