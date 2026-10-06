import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { ResultsManager } from "@/components/admin/ResultsManager";

export const metadata: Metadata = { title: "Resultados" };
export const dynamic = "force-dynamic";

export default async function AdminResultadosPage() {
  await requirePermission("resultados");

  const matches = await prisma.match.findMany({
    orderBy: [{ date: "desc" }, { time: "desc" }],
    include: { homeTeam: true, awayTeam: true, goals: true },
  });

  return <ResultsManager matches={matches} />;
}
