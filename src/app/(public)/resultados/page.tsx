import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { ResultsList } from "@/components/ResultsList";

export const metadata: Metadata = { title: "Resultados" };
export const dynamic = "force-dynamic";

export default async function ResultadosPage() {
  const matches = await prisma.match.findMany({
    where: { status: { in: ["FINALIZADO", "EN_CURSO", "SUSPENDIDO"] } },
    orderBy: [{ date: "desc" }, { time: "desc" }],
    include: { homeTeam: true, awayTeam: true, goals: true },
  });

  return (
    <div>
      <PageHeader title="Resultados" subtitle="Partidos jugados y en curso. Tocá un partido para ver el detalle." />
      <div className="container-page py-8">
        <div className="card p-3 sm:p-5">
          <ResultsList matches={matches} />
        </div>
      </div>
    </div>
  );
}
